# 0012 タップ音は expo-audio で鳴らす

- 日付：2026-10-13
- 状態：決定

## 決定
カウントのタップ音は公式モジュール `expo-audio` と、同梱の 44.1kHz WAV（`assets/sounds/tap.wav`、約110ms・フェード付き）で再生する。録音は使わない（マイク権限は出さない）。

起動時にプレイヤーを2つ `createAudioPlayer` し、`isLoaded` になるまで待つ。タップでは空き枠を選び `await seekTo(0)` のあと `play()` する。プレイヤーは解放しない。iOS では `keepAudioSessionActive: true` を付け、短い効果音の終了でオーディオセッションが切られないようにする。

## 理由
設定の「タップ音」はオンにしたときに実際に鳴る必要がある。SDK 57 の再生 API は `expo-audio`。＋/− のどこからでも鳴らすため、画面に縛られない `createAudioPlayer` を使う。

実機 iPhone（Expo Go）では、毎回新規プレイヤーを作って `play()` したり、終わったプレイヤーを `remove()` したりすると、再生終了でセッションが inactive になり、次の `play()` が隔回 no-op になる。SDK 57 の短SFX向けオプションが `keepAudioSessionActive` で、公式のリプレイ手順は `seekTo(0)` してから `play()`。

## 見送った案
- トグルを「準備中」にして無効化する：設定としては動くが、要件のタップ音にならない
- `expo-av`：SDK 57 では `expo-audio` が推奨
- タップごとに `createAudioPlayer` + `remove()`：セッションの on/off で隔回無音になる
- 終わったプレイヤーへの `pause` + `seekTo` + `play` 再利用：iOS で隔回 no-op になる
