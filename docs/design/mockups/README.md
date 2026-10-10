# 画面モックアップ（参照用の写し）

元データは Claude Design「カウンター＋ 画面デザイン」（https://claude.ai/artifact/6uz142ePmrGrD97bJFfrze）。
デザインを変えるときはキャンバスを直し、ここのファイルを差し替える。

| ファイル | 画面 | 実装先 |
| --- | --- | --- |
| List.dc.html | ホーム（リスト・採用案） | src/app/index.tsx |
| Edit.dc.html | 項目の編集（ボトムシート） | src/app/counter/[id].tsx |
| Categories.dc.html | カテゴリ一覧 | src/app/categories.tsx |
| Settings.dc.html | 設定 | src/app/settings.tsx |
| History.dc.html | 履歴（Pro） | src/app/history.tsx |
| Export.dc.html | CSV出力（Pro） | src/app/export.tsx |
| Paywall.dc.html | Pro購入 | src/app/paywall.tsx |
| _archive/Main.dc.html | ホーム（2列グリッド・不採用） | 参考のみ。実装に使わない |

## 読み方（AI向け）

- 各ファイルは HTML のモックアップ。`style` 属性の値（余白・色・文字サイズ・角丸）を、NativeWind のクラスと `docs/design/screens.md` のトークンに置き換えて実装する。
- `{{...}}` は表示用の差し込み、末尾の `<script>` は見本データと簡単な操作。ロジックの参考にはするが、そのまま移植しない（データは SQLite と Zustand から取る）。
- `<sc-for>` は繰り返し、`<sc-if>` は条件表示。
- `support.js` はデザインキャンバス専用のため、リポジトリには含まれない。ブラウザで単体では開けない。見た目はキャンバスで確認する。
- エディタの HTML 警告は Canvas 用タグ（`x-dc` / `helmet` / `sc-for` / `sc-if`）と `style` 内の `{{...}}` によるもの。`.vscode/dc-html-custom-data.json` と `html.validate.styles` で抑止している。CLI 検証はこのフォルダで `npx html-validate .`（`.htmlvalidate.json` 参照）。
- 仕様と食い違うときは `docs/design/screens.md` を正とする。
