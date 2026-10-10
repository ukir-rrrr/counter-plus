# 0008 UIはNativeWind＋React Native Reusables

- 日付：2026-10-09
- 状態：決定

## 決定
スタイルはNativeWind（Tailwind）で書き、必要な部品だけReact Native Reusablesからコピーして使う。編集シートは@gorhom/bottom-sheet、長押しの並べ替えはreact-native-draggable-flatlistを使う。

## 理由
独自デザインに合わせて部品を直せる。画面の部品は少ない（ボタン、入力欄、スイッチ、シート、リスト）ので、大きな部品セットは不要。CursorやClaude CodeもTailwindに書き慣れている。

## 見送った案
- Mantine：Web専用で、React Native・Expoでは使えない
- Tamagui、gluestack-ui、React Native Paper
