import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { useSettingsStore } from '@/features/settings/store';

import tapSoundSource from '../../assets/sounds/tap.wav';

/** 同時に生きていてよいワンショットプレイヤーの上限 */
export const TAP_SOUND_MAX_LIVE = 6;

type AudioStatusLike = {
  playing?: boolean;
  didJustFinish?: boolean;
  currentTime?: number;
  playbackState?: string;
  isLoaded?: boolean;
};

type EventSub = { remove: () => void };

type TapPlayer = {
  play: () => void;
  replace?: (source: number) => void;
  remove?: () => void;
  currentStatus?: AudioStatusLike;
  addListener?: (event: 'playbackStatusUpdate', cb: (status: AudioStatusLike) => void) => EventSub;
};

type SoundPlayerFn = () => void;

type LiveShot = {
  seq: number;
  player: TapPlayer;
  release: () => void;
};

let live: LiveShot[] = [];
let tapSeq = 0;
let testPlayer: TapPlayer | SoundPlayerFn | null = null;
let audioModeReady: Promise<void> | null = null;

function ensureAudioMode(): Promise<void> {
  if (!audioModeReady) {
    audioModeReady = setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    })
      .then(() => undefined)
      .catch(() => undefined);
  }
  return audioModeReady;
}

function logTap(seq: number, player: TapPlayer, extra: string): void {
  if (!__DEV__) return;
  const status = player.currentStatus;
  console.log('[tapSound]', {
    seq,
    live: live.length,
    extra,
    playing: status?.playing,
    didJustFinish: status?.didJustFinish,
    currentTime: status?.currentTime,
    playbackState: status?.playbackState,
    isLoaded: status?.isLoaded,
  });
}

function releaseShot(shot: LiveShot): void {
  const index = live.indexOf(shot);
  if (index < 0) return;
  live.splice(index, 1);
  try {
    shot.player.remove?.();
  } catch {
    // 解放失敗は無視
  }
}

async function playOneShot(): Promise<void> {
  try {
    await ensureAudioMode();

    while (live.length >= TAP_SOUND_MAX_LIVE) {
      live[0]?.release();
    }

    const seq = ++tapSeq;
    const player = createAudioPlayer(tapSoundSource, { updateInterval: 50 });

    let released = false;
    let sub: EventSub | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const shot: LiveShot = {
      seq,
      player,
      release: () => {
        if (released) return;
        released = true;
        sub?.remove();
        if (timer != null) clearTimeout(timer);
        releaseShot(shot);
      },
    };
    live.push(shot);

    sub = player.addListener?.('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        logTap(seq, player, 'didJustFinish');
        shot.release();
      }
    });
    timer = setTimeout(() => shot.release(), 400);

    logTap(seq, player, 'play');
    player.play();
  } catch {
    // 再生失敗はカウントを止めない
  }
}

/** テスト用。タップ音の再生処理を差し替える */
export function setTapSoundPlayerForTests(next: TapPlayer | SoundPlayerFn | null): void {
  testPlayer = next;
}

/** テスト用。ワンショット状態を戻す */
export function resetTapSoundForTests(): void {
  for (const shot of [...live]) shot.release();
  live = [];
  tapSeq = 0;
  testPlayer = null;
  audioModeReady = null;
}

/** ＋・−を押したときのタップ音（設定がオンのときだけ） */
export function tapSound(): void {
  if (!useSettingsStore.getState().sound) return;
  try {
    if (typeof testPlayer === 'function') {
      testPlayer();
      return;
    }
    if (testPlayer) {
      testPlayer.play();
      return;
    }
    void playOneShot();
  } catch {
    // 再生失敗はカウントを止めない
  }
}
