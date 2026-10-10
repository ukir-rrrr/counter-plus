# 0011 編集シートは透明なモーダル画面の上に出す

- 日付：2026-10-10
- 状態：決定

## 決定
項目の編集シートは Expo Router の画面 `src/app/counter/[id].tsx` として作る。`presentation: 'transparentModal'` で背景が透ける画面を開き、その上に @gorhom/bottom-sheet の `BottomSheet` を出す。シートが閉じたら `router.back()` で画面も閉じる。

リセットの「元に戻す」は5秒間だけ出す。取り消したときは reset の履歴行を消す（履歴には何も起きなかったように残る）。リセットのあとにその項目の数が変わったら取り消せない。

## 理由
- `docs/architecture.md` のとおり、画面ごとにルートを持てる（IDを渡すだけで開ける）
- ホーム画面に `BottomSheetModal` を置く方法より、画面の責任が分かれる
- 取り消しを「数を戻す edit を足す」にすると、履歴に意味のない2行が残る

## 見送った案
- ホーム画面に `BottomSheetModal` を置く：ホームの部品が増え、ほかの画面から開けない
- iOS 標準の `formSheet`：見た目（角丸・ハンドル・高さ）をモックアップに合わせにくい
