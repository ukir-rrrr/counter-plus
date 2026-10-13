# カウンター＋ アーキテクチャ

> 元資料：Claude Docs「カウンター＋ アーキテクチャ」（2026-10-09）

サーバーを持たず、Expo（React Native）で端末内のSQLiteに保存する構成にする。通信するのは広告・課金・計測だけ。

## 技術スタック

Expo SDK 57を土台にし、定番で情報の多いライブラリだけを使う。追加は必ず `npx expo install`。

| 役割 | 使うもの | 理由 |
| --- | --- | --- |
| 土台 | Expo（React Native）＋TypeScript | ビルドとストア提出まで一貫して扱える |
| 画面遷移 | Expo Router（`src/app/`） | ファイルを置くだけで画面が増える |
| データ保存 | expo-sqlite ＋ Drizzle ORM | 端末内で完結。履歴や並べ替えをSQLで素直に扱える。Drizzleで型安全にする |
| ID生成 | expo-crypto | UUIDを作る（`randomUUID()`） |
| 画面の状態 | Zustand | カウントを即座に画面へ反映する。小さく覚えることが少ない |
| フォント | @expo-google-fonts（IBM Plex Sans JP / IBM Plex Mono）＋ expo-font | 使う太さだけを読み込む |
| スタイルとUI部品 | NativeWind ＋ React Native Reusables | Tailwindの書き方で独自の見た目を作れる。部品はコードをコピーして自分で直せる |
| ボトムシート | @gorhom/bottom-sheet | 「項目の編集」シート。スワイプで閉じるなどの動きが安定している |
| 並べ替えのUI | react-native-reanimated ＋ react-native-gesture-handler ＋ react-native-draggable-flatlist | 長押しでの移動を滑らかにする |
| CSV出力 | expo-file-system ＋ expo-sharing | ファイルを書いて共有シートで送る |
| 振動 | expo-haptics | タップ時の手応え |
| 画面を消さない | expo-keep-awake | 棚卸しの途中で画面が暗くならないようにする（設定で切り替え） |
| 課金 | RevenueCat（react-native-purchases） | 購入・復元・Pro判定を任せられる。売上が少ないうちは無料で使える |
| 広告 | Google AdMob（react-native-google-mobile-ads） | バナー広告の定番 |
| 追跡許可 | expo-tracking-transparency | パーソナライズ広告のためのATT表示 |
| 計測 | PostHog | どの機能が使われたかを記録する |
| ビルドと配布 | EAS Build / EAS Submit / EAS Update | クラウドでビルドし、App Store Connectへ提出する |

広告と課金はネイティブのモジュールを使うため、Expo Goでは動かない。開発は最初からDevelopment Build（`eas build --profile development`）で行う。

## 全体構成

```
┌──────────── 端末の中（オフラインで完結）────────────┐   ┌──── 通信するもの ────┐
│ 画面（Expo Router）                                │ → │ 広告（AdMob）         │
│   ↓ 操作        ↑ 表示を更新                       │   │                       │
│ 状態とロジック（Zustand）                          │ → │ 課金（RevenueCat）    │
│   ↓ 書き込み（保存ボタンなし）                     │ → │ 計測（PostHog）       │
│ 端末のDB（SQLite＋Drizzle）                        │   │                       │
└────────────────────────────────────────────────────┘   └───────────────────────┘
```

タップすると、まずZustandの値を書き換えて数字をすぐに表示し、そのあとSQLiteへの保存と履歴の追加を裏で行う。通信が切れても、カウントと保存は影響を受けない。

## データ設計

テーブルは4つ。履歴は無料版でも裏で記録しておき、Proを買った瞬間に過去の履歴が見えるようにする。IDはUUIDにして、将来のクラウド同期に備える。

**categories（カテゴリ）**

| 列 | 型 | 内容 |
| --- | --- | --- |
| id | TEXT | UUID |
| name | TEXT | カテゴリ名（例：棚 A） |
| sort_order | INTEGER | 表示順 |
| created_at / updated_at | INTEGER | 作成・更新日時（UNIXミリ秒） |

**counters（項目）**

| 列 | 型 | 内容 |
| --- | --- | --- |
| id | TEXT | UUID |
| category_id | TEXT | 所属カテゴリ |
| name | TEXT | 項目名 |
| count | INTEGER | 現在の数（0以上） |
| memo | TEXT | メモ（任意） |
| color | TEXT | 色のキー |
| sort_order | INTEGER | 表示順 |
| created_at / updated_at | INTEGER | 作成・更新日時 |

**count_events（履歴）**

| 列 | 型 | 内容 |
| --- | --- | --- |
| id | TEXT | UUID |
| counter_id | TEXT | 対象の項目 |
| delta | INTEGER | 変化量（＋1、−1、リセット時は差分） |
| count_after | INTEGER | 変化後の数 |
| type | TEXT | increment / decrement / edit / reset |
| created_at | INTEGER | 発生日時 |

**app_settings（設定）**：keyとvalueの2列。振動・音・画面を消さないのオンオフ、最後に開いたカテゴリなど。

- カテゴリを消すと、その項目と履歴も消える（削除前に確認を出す）。
- Proかどうかの正はRevenueCat。最後に確認できた entitlement はオフライン用に `app_settings`（`is_pro`）へキャッシュする。
- 履歴が増えすぎた場合の整理方法は、公開後に使われ方を見て決める。

## ディレクトリ構成

画面（`src/app/`）と機能ごとの層（`src/features/`）を分ける。課金・広告・計測は `src/lib/` にまとめ、次のアプリでもそのまま使えるようにする。

```
counter-plus/
  src/
    app/                    # 画面（Expo Router）。ルートだけを置く
      _layout.tsx           # 初期化：DB移行、RevenueCat、計測。ATTと広告はホーム表示後
      index.tsx             # ホーム（リスト）
      categories.tsx        # カテゴリ一覧
      counter/[id].tsx      # 項目の編集（シート）
      history.tsx           # 履歴（Pro）
      export.tsx            # CSV出力（Pro）
      settings.tsx          # 設定
      paywall.tsx           # Pro購入
    db/
      schema.ts             # Drizzleのテーブル定義
      client.ts             # SQLiteの接続
      migrations/           # スキーマ変更の履歴
    features/
      counters/             # カウント操作、store、repository、コンポーネント
      categories/
      history/
      export/               # CSV生成と共有
      settings/
    lib/
      purchases.ts          # RevenueCat、useIsPro() / getIsPro()
      ads.tsx               # バナー（Proなら表示しない）
      analytics.ts          # PostHogのイベント送信
      haptics.ts
    components/             # 共通のUI部品（Reusablesから持ってきたものもここ）
    constants/theme.ts      # 色・文字サイズ・角丸のトークン
  docs/
  CLAUDE.md
  AGENTS.md
  app.json
  eas.json
```

## 課金・広告・計測

Proかどうかは `useIsPro()` / `getIsPro()`（`src/lib/purchases.ts`）で判定し、広告の表示と機能の解放はすべてこれを見る。

**課金（RevenueCat）**

- 商品は「消費しない買い切り」1つ（例：`pro_lifetime`）。RevenueCatのEntitlementは `pro`。
- 起動時に購入状態を取得し、オフラインでは前回の結果（RevenueCatのキャッシュ）を使う。
- 設定画面と購入画面に「購入を復元」ボタンを置く（審査で必須）。
- Pro限定の操作（履歴、CSV出力、2つ目のカテゴリ、自動並べ替え）では、未購入なら購入画面を開く。購入画面は開いた理由（`openedFrom`）に合わせて、その機能を強調する。

**広告（AdMob）**

- ホーム画面最下部にアダプティブバナーを1つだけ置く。他の画面には出さない。
- ボタンとの間に余白をとり、誤タップを防ぐ。
- ホーム画面が見えてからATTの確認を出す（スプラッシュ中には出さない）。拒否されたら非パーソナライズ広告にする。
- 開発中はテスト広告IDを使う（本番IDで自分でタップするとアカウント停止の恐れがある）。

**計測（PostHog）**

項目名やメモなど、ユーザーが入力した中身は送らない。

| イベント | 知りたいこと |
| --- | --- |
| app_open | 継続して使われているか |
| counter_created / category_created | どれくらいの規模で使うか |
| count_tapped | カウントされているか（回数だけ。毎回は送らずまとめて送る） |
| pro_gate_shown | どのPro機能で購入画面が出たか（`from` は csv / history / category / sort / ads。設定からの自主オープンは送らない） |
| purchase_completed | どこから買われたか |
| csv_exported | 棚卸し用途で使われているか |

## 開発・ビルド・リリース

EASの3つのプロファイル（development / preview / production）で進める。

1. **準備**：Apple Developer Program、RevenueCat、AdMob、PostHogのアカウントを作る。App Store Connectでアプリと買い切り商品を登録する
2. **開発**：`development` プロファイルのDevelopment Buildを自分のiPhoneに入れ、ホットリロードで開発する
3. **課金の確認**：Sandboxのテストアカウントで、購入・復元・広告が消えることを確かめる
4. **テスト配布**：`preview` または `production` ビルドをTestFlightで配る
5. **提出**：`eas submit` でApp Store Connectへ。スクリーンショット、説明文、プライバシーポリシーのURL、プライバシーの申告（広告と計測の分）を用意する
6. **公開後の小さな修正**：JavaScriptだけの変更はEAS Updateで配信できる。ネイティブの変更を含む場合は再提出する
