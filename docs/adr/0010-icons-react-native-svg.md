# 0010 アイコンは react-native-svg で描く

- 日付：2026-10-10
- 状態：決定

## 決定
画面のアイコン（メニュー、歯車、＋・−、履歴、CSV出力、並べ替えなど）は、`docs/design/mockups/` のSVGを `react-native-svg` でそのまま描く。部品は `src/components/icons.tsx` にまとめ、色はトークン（`src/constants/theme.ts`）を渡す。

## 理由
モックアップのアイコンはSVGで書かれているので、パスを移せば見た目が完全に一致する。`react-native-svg` は Expo Go に含まれていて、Development Build なしでも確認できる。

## 見送った案
- expo-symbols（SF Symbols）：追加は不要だが iOS 専用で、線の太さや形がモックアップと少し違う
- View や文字でそれらしく描く：依存は増えないが、歯車などが再現できない
