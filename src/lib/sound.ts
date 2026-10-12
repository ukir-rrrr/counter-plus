import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { useSettingsStore } from '@/features/settings/store';

import tapSoundSource from '../../assets/sounds/tap.wav';

type TapPlayer = {
  play: () => void;
  seekTo: (seconds: number) => unknown;
};

type SoundPlayerFn = () => void;

let player: TapPlayer | null = null;
let testPlayer: TapPlayer | SoundPlayerFn | null = null;
let audioModeRequested = false;

function ensureAudioMode(): void {
  if (audioModeRequested) return;
  audioModeRequested = true;
  setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
  }).catch(() => {});
}

function getPlayer(): TapPlayer {
  if (testPlayer && typeof testPlayer !== 'function') return testPlayer;
  if (!player) {
    player = createAudioPlayer(tapSoundSource);
    ensureAudioMode();
  }
  return player;
}

/** テスト用。タップ音の再生処理を差し替える */
export function setTapSoundPlayerForTests(next: TapPlayer | SoundPlayerFn | null): void {
  testPlayer = next;
}

/** テスト用。本番プレイヤーの遅延生成をやり直す */
export function resetTapSoundForTests(): void {
  testPlayer = null;
  player = null;
  audioModeRequested = false;
}

/** ＋・−を押したときのタップ音（設定がオンのときだけ） */
export function tapSound(): void {
  if (!useSettingsStore.getState().sound) return;
  try {
    if (typeof testPlayer === 'function') {
      testPlayer();
      return;
    }
    const current = getPlayer();
    current.seekTo(0);
    current.play();
  } catch {
    // 再生失敗はカウントを止めない
  }
}
