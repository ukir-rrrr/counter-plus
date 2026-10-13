import { createAudioPlayer, preload, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { useEffect, useState } from 'react';

import { useSettingsStore } from '@/features/settings/store';

import tapSoundSource from '../../assets/sounds/tap.wav';

/** 起動時に確保して使い回すプレイヤー数。解放しない */
export const TAP_SOUND_POOL_SIZE = 2;

export type TapSoundDebugEvent = {
  seq: number;
  slot: number;
  isLoaded?: boolean;
  playing?: boolean;
  didJustFinish?: boolean;
  currentTime?: number;
  playbackState?: string;
  extra: string;
};

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
  seekTo: (seconds: number) => Promise<unknown>;
  playing?: boolean;
  isLoaded?: boolean;
  currentTime?: number;
  currentStatus?: AudioStatusLike;
  addListener?: (event: 'playbackStatusUpdate', cb: (status: AudioStatusLike) => void) => EventSub;
};

type SoundPlayerFn = () => void;

let pool: TapPlayer[] | null = null;
let poolReady: Promise<void> | null = null;
let tapSeq = 0;
let testPlayer: TapPlayer | SoundPlayerFn | null = null;
let debugEvents: TapSoundDebugEvent[] = [];
const debugListeners = new Set<(events: TapSoundDebugEvent[]) => void>();

function snapshotStatus(player: TapPlayer): AudioStatusLike {
  const status = player.currentStatus;
  return {
    playing: player.playing ?? status?.playing,
    didJustFinish: status?.didJustFinish,
    currentTime: player.currentTime ?? status?.currentTime,
    playbackState: status?.playbackState,
    isLoaded: player.isLoaded ?? status?.isLoaded,
  };
}

function isLoaded(player: TapPlayer): boolean {
  return snapshotStatus(player).isLoaded === true;
}

function isPlaying(player: TapPlayer): boolean {
  return snapshotStatus(player).playing === true;
}

function notifyDebug(): void {
  const copy = debugEvents.slice();
  for (const listener of debugListeners) listener(copy);
}

function recordTap(event: TapSoundDebugEvent): void {
  debugEvents = [...debugEvents, event].slice(-5);
  notifyDebug();
  if (__DEV__ && process.env.JEST_WORKER_ID == null) {
    console.log('[tapSound]', event);
  }
}

export function getTapSoundDebugEvents(): TapSoundDebugEvent[] {
  return debugEvents.slice();
}

export function subscribeTapSoundDebug(listener: (events: TapSoundDebugEvent[]) => void): () => void {
  debugListeners.add(listener);
  listener(debugEvents.slice());
  return () => {
    debugListeners.delete(listener);
  };
}

/** 設定の開発用表示。直近5件のタップ音イベント */
export function useTapSoundDebug(): TapSoundDebugEvent[] {
  const [events, setEvents] = useState(getTapSoundDebugEvents);
  useEffect(() => subscribeTapSoundDebug(setEvents), []);
  return events;
}

function waitUntilLoaded(player: TapPlayer, timeoutMs = 2000): Promise<void> {
  if (isLoaded(player)) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    let sub: EventSub | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (settled) return;
      settled = true;
      sub?.remove();
      if (timer != null) clearTimeout(timer);
      resolve();
    };
    sub = player.addListener?.('playbackStatusUpdate', (status) => {
      if (status.isLoaded) finish();
    });
    timer = setTimeout(finish, timeoutMs);
  });
}

function pickSlot(): number {
  if (!pool?.length) return 0;
  const idle = pool.findIndex((player) => !isPlaying(player));
  if (idle >= 0) return idle;
  return tapSeq % pool.length;
}

async function ensurePool(): Promise<void> {
  if (poolReady) return poolReady;
  poolReady = (async () => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => undefined);
    await setIsAudioActiveAsync(true).catch(() => undefined);
    await preload(tapSoundSource).catch(() => undefined);

    const players = Array.from({ length: TAP_SOUND_POOL_SIZE }, () =>
      createAudioPlayer(tapSoundSource, {
        updateInterval: 50,
        keepAudioSessionActive: true,
      })
    );
    await Promise.all(players.map((player) => waitUntilLoaded(player)));
    pool = players;
  })().catch(() => {
    pool = null;
    poolReady = null;
  });
  return poolReady;
}

/** 起動時にプレイヤーを先に載せておく */
export function preloadTapSound(): void {
  void ensurePool();
}

async function playFromPool(): Promise<void> {
  await ensurePool();
  if (!pool?.length) return;

  const slot = pickSlot();
  const player = pool[slot];
  if (!player) return;
  const seq = ++tapSeq;
  const before = snapshotStatus(player);

  recordTap({
    seq,
    slot,
    isLoaded: before.isLoaded,
    playing: before.playing,
    didJustFinish: before.didJustFinish,
    currentTime: before.currentTime,
    playbackState: before.playbackState,
    extra: 'seek+play',
  });

  if (!isLoaded(player)) {
    await waitUntilLoaded(player);
  }
  await player.seekTo(0);
  player.play();
}

/** テスト用。タップ音の再生処理を差し替える */
export function setTapSoundPlayerForTests(next: TapPlayer | SoundPlayerFn | null): void {
  testPlayer = next;
}

/** テスト用。プールとデバッグ履歴を戻す */
export function resetTapSoundForTests(): void {
  pool = null;
  poolReady = null;
  tapSeq = 0;
  testPlayer = null;
  debugEvents = [];
  notifyDebug();
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
      const player = testPlayer;
      void player.seekTo(0).then(() => {
        player.play();
      });
      return;
    }
    void playFromPool();
  } catch {
    // 再生失敗はカウントを止めない
  }
}
