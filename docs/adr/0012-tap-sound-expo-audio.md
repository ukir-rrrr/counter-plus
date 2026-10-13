# 0012 タップ音は expo-audio で鳴らす

- 日付：2026-10-12
- 状態：決定

## 決定
カウントのタップ音は公式モジュール `expo-audio` と、同梱の 44.1kHz WAV（`assets/sounds/tap.wav`、約110ms・フェード付き）で再生する。録音は使わない（マイク権限は出さない）。毎回 `createAudioPlayer` して再生し、`didJustFinish` で `remove()` する。再利用時の `pause` + `seekTo` + `play` は iOS で隔回 no-op になるので使わない。

## 理由
設定の「タップ音」はオンにしたときに実際に鳴る必要がある。SDK 57 の再生 API は `expo-audio`。＋/− のどこからでも鳴らすため、画面に縛られない `createAudioPlayer` を使う。

## 見送った案
- トグルを「準備中」にして無効化する：設定としては動くが、要件のタップ音にならない
- `expo-av`：SDK 57 では `expo-audio` が推奨
