import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { useSettingsStore } from '@/features/settings/store';

import tapSoundSource from '../../assets/sounds/tap.wav';

/** 連打でも前の再生と seek がぶつからないよう、短い音を複数プレイヤーで回す */
export const TAP_SOUND_POOL_SIZE = 3;

type TapPlayer = {
  play: () => void;
  pause?: () => void;
  seekTo: (seconds: number) => unknown;
};

type SoundPlayerFn = () => void;

let pool: TapPlayer[] = [];
let nextIndex = 0;
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

function getPool(): TapPlayer[] {
  if (testPlayer && typeof testPlayer !== 'function') return [testPlayer];
  if (pool.length === 0) {
    pool = Array.from({ length: TAP_SOUND_POOL_SIZE }, () => createAudioPlayer(tapSoundSource));
    ensureAudioMode();
  }
  return pool;
}

async function restart(player: TapPlayer): Promise<void> {
  try {
    player.pause?.();
    await Promise.resolve(player.seekTo(0));
    player.play();
  } catch {
    // 再生失敗はカウントを止めない
  }
}

/** テスト用。タップ音の再生処理を差し替える */
export function setTapSoundPlayerForTests(next: TapPlayer | SoundPlayerFn | null): void {
  testPlayer = next;
}

/** テスト用。本番プレイヤーの遅延生成をやり直す */
export function resetTapSoundForTests(): void {
  testPlayer = null;
  pool = [];
  nextIndex = 0;
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
    const players = getPool();
    const current = players[nextIndex % players.length];
    nextIndex += 1;
    void restart(current);
  } catch {
    // 再生失敗はカウントを止めない
  }
}
