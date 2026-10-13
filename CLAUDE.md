# カウンター＋（counter-plus）

@AGENTS.md

## このアプリ

「開けばすぐ数えられて、勝手に保存され、終わったらCSVで送れる」、たくさんの項目をまとめて数えるカウンター。
メインユーザーは小さな店や現場で手作業の棚卸しをする人。無料＋バナー広告、買い切りProで収益化する。

## 実装前に必ず読む資料

| ファイル | 内容 |
| --- | --- |
| `docs/requirements.md` | 要件定義（機能・無料/Proの線引き・非機能要件） |
| `docs/architecture.md` | 技術スタック・データ設計・ディレクトリ構成 |
| `docs/adr/` | 決定記録。ここにない技術判断をするときは先に相談する |
| `docs/design/screens.md` | 各画面の仕様とデザイントークン |
| `docs/design/mockups/` | 各画面のHTMLモックアップ。画面を作るときは対応するファイルを見て、見た目を合わせる（`_archive/` は使わない） |
| `docs/implementation-plan.md` | 実装の順番とチェックリスト |
| `docs/revenuecat-setup.md` | RevenueCat / App Store Connect のオーナー作業 |
| `docs/ads-analytics-setup.md` | AdMob / ATT / PostHog / App Store プライバシー申告のオーナー作業 |

`docs/private/`（Git管理外・公開リポジトリには無い）に事業資料がある場合は参照してよい。
ただし、その内容（価格の根拠、収益目標、競合の名前や分析）をコード・コメント・コミットメッセージ・公開ドキュメントに書かない。

## 言語

- 返答・計画・説明は日本語で書く
- コミットメッセージは日本語で、`種類: 内容` の形にする（例：`feat: ホーム画面にカウント機能を追加`、`fix: −で0未満になる不具合を修正`）。種類は feat / fix / refactor / style / docs / chore
- コード中のコメントも日本語。変数名・関数名・ファイル名は英語

## 技術スタック（固定）

Expo SDK 57 / Expo Router（`src/app/`）/ TypeScript strict / NativeWind ＋ React Native Reusables /
expo-sqlite ＋ Drizzle ORM / Zustand / @gorhom/bottom-sheet / react-native-draggable-flatlist /
expo-file-system ＋ expo-sharing / expo-haptics / expo-keep-awake /
RevenueCat（react-native-purchases）/ AdMob（react-native-google-mobile-ads）/ expo-tracking-transparency / PostHog

## コーディング規約

- パッケージは必ず `npx expo install <package>` で入れる。ADRにないライブラリを追加する前に確認する
- `src/app/` には画面（ルート）だけを置く。ロジックは `src/features/`、DBは `src/db/`、外部サービスは `src/lib/`
- 画面から直接SQLを書かない。DBアクセスは `src/features/*/repository.ts` 経由
- カウント操作の順番：Zustandの値を更新して即座に描画 → SQLiteに保存し、同じトランザクションで `count_events` に1行追加
- 保存ボタンは作らない（すべて自動保存）
- Proかどうかの判定は `useIsPro()`（`src/lib/purchases.ts`）だけで行う
- 広告はホーム画面最下部のバナー1つだけ。Proなら表示しない。開発中は必ずAdMobのテスト広告IDを使う
- 計測イベントに、項目名やメモなどユーザーが入力した内容を含めない
- 色・文字サイズ・角丸は `docs/design/screens.md` のトークンを使い、直書きしない
- UIの文言は日本語。タッチ領域は44pt以上。アイコンだけのボタンには `accessibilityLabel` を付ける
- IDはUUID。日時はUNIXミリ秒（INTEGER）

## 作業の進め方

- 1回の作業は `docs/implementation-plan.md` の1ステップ分にする
- 終わったら `npx expo lint` と `npx tsc --noEmit` を通し、計画のチェックボックスを更新する
- 設計を変えたときは `docs/adr/` に新しいADRを追加する
