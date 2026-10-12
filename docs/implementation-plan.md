# カウンター＋ 実装計画

AIに頼むときは「implementation-plan.md のステップ N を実装して」と1ステップずつ依頼する。
各ステップの最後に `npx expo lint` と `npx tsc --noEmit` を通し、チェックを付ける。

## ステップ0：テンプレートの整理

- [x] テンプレートのサンプル画面（タブ、explore など）を片付ける（`npm run reset-project` を使うか手で削除）
- [x] app.json の name を「カウンター＋」に、bundleIdentifier を設定する
- [x] 縦向き固定、ダークモード対応（userInterfaceStyle: automatic）を確認する

## ステップ1：土台

- [x] NativeWind を導入し、`docs/design/screens.md` のトークンを tailwind.config と `src/constants/theme.ts` に定義する
- [x] IBM Plex Sans JP / IBM Plex Mono を読み込む
- [x] expo-sqlite ＋ Drizzle を導入し、`src/db/schema.ts` に4テーブル（categories / counters / count_events / app_settings）を定義する
- [x] マイグレーションを用意し、`src/app/_layout.tsx` で起動時に実行する
- [x] 初回起動時に「カテゴリ 1」を1つ作る

## ステップ2：ホーム（リスト）とカウント

- [x] `src/features/counters/`：repository（CRUD・増減）と Zustand store
- [x] 増減は「store更新 → 即描画 → SQLite更新＋count_events追加（同一トランザクション）」
- [x] 0未満にしない
- [x] ホーム画面：ヘッダー、合計カード（自動保存済みチップ）、リスト行（−・数・＋）、項目を追加
- [x] expo-haptics でタップ時に振動（設定に従う）
- [x] expo-keep-awake（設定に従う）

## ステップ3：項目の編集とリセット・削除

- [x] @gorhom/bottom-sheet で編集シート（行の長押しで開く）
- [x] ±1、±5、±10、数値の直接入力
- [x] 名前・メモ・色・カテゴリの変更（すべて自動保存）
- [x] リセット（取り消し可能）と削除（確認あり）

## ステップ4：カテゴリと並べ替え

- [x] カテゴリ一覧画面（合計・項目数・選択）
- [x] カテゴリの追加・名前変更・削除（中の項目と履歴も削除、確認あり）
- [x] react-native-draggable-flatlist で長押し並べ替え（sort_order を保存）
- [x] 自動並べ替え（名前順・数の多い順・少ない順）※この時点ではProの制限なしで作る

## ステップ5：履歴とCSV出力

- [x] 履歴画面（日付見出し、カテゴリで絞り込み、変化のバッジ）
- [x] CSV出力画面（範囲・列の選択、プレビュー）
- [x] UTF-8 BOM付きで書き出し、expo-sharing で共有シートを開く

## ステップ6：設定

- [ ] 振動・タップ音・画面を消さないの切り替え（app_settings に保存）
- [ ] 購入を復元、レビュー・お問い合わせ・規約・プライバシーポリシーへのリンク、バージョン表示

## ステップ7：課金（RevenueCat）

- [ ] App Store Connect に買い切り商品を登録し、RevenueCat に Entitlement `pro` を作る
- [ ] `src/lib/purchases.ts`：初期化、`useIsPro()`、購入、復元
- [ ] Pro購入画面（openedFrom で特典を強調、履歴の件数を表示、価格はRevenueCatから取得）
- [ ] Proの制限をかける：2つ目のカテゴリ、自動並べ替え、履歴、CSV出力
- [ ] Sandbox で購入・復元を確認する

## ステップ8：広告と計測

- [ ] expo-tracking-transparency で初回起動時にATT
- [ ] `src/lib/ads.tsx`：ホーム最下部にアダプティブバナー（Proなら非表示、開発中はテストID）
- [ ] `src/lib/analytics.ts`：PostHog のイベント（architecture.md の表のとおり。入力内容は送らない）

## ステップ9：リリース準備

- [ ] アプリアイコンとスプラッシュ
- [ ] プライバシーポリシーと利用規約のページ
- [ ] App Store の説明文・キーワード・スクリーンショット
- [ ] TestFlight で実機テスト（できれば実際の棚卸しで試してもらう）
- [ ] `eas build --profile production` → `eas submit`
