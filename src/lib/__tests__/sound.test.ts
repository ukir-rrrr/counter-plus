import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { useSettingsStore } from '@/features/settings/store';

import {
  resetTapSoundForTests,
  setTapSoundPlayerForTests,
  TAP_SOUND_MAX_LIVE,
  tapSound,
} from '../sound';

const createAudioPlayerMock = createAudioPlayer as jest.MockedFunction<typeof createAudioPlayer>;
const setAudioModeAsyncMock = setAudioModeAsync as jest.MockedFunction<typeof setAudioModeAsync>;

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockPlayer() {
  const listeners: ((status: { didJustFinish?: boolean }) => void)[] = [];
  return {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    replace: jest.fn(),
    remove: jest.fn(),
    currentStatus: { playing: false, didJustFinish: false, currentTime: 0, isLoaded: true },
    addListener: jest.fn((_event: string, cb: (status: { didJustFinish?: boolean }) => void) => {
      listeners.push(cb);
      return { remove: jest.fn() };
    }),
    emit(status: { didJustFinish?: boolean }) {
      for (const cb of listeners) cb(status);
    },
  };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('tapSound', () => {
  const playerFn = jest.fn();

  beforeEach(() => {
    jest.useRealTimers();
    playerFn.mockReset();
    resetTapSoundForTests();
    createAudioPlayerMock.mockReset();
    createAudioPlayerMock.mockImplementation(() => mockPlayer() as never);
    setAudioModeAsyncMock.mockReset();
    setAudioModeAsyncMock.mockResolvedValue(undefined as never);
    useSettingsStore.setState({ haptics: true, sound: false, keepAwake: true, error: null });
  });

  afterEach(() => {
    resetTapSoundForTests();
  });

  it('通常：オンならモード設定のあとワンショット再生する', async () => {
    const player = mockPlayer();
    createAudioPlayerMock.mockReturnValue(player as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await flush();

    expect(setAudioModeAsyncMock).toHaveBeenCalled();
    expect(createAudioPlayerMock).toHaveBeenCalledTimes(1);
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.addListener).toHaveBeenCalledWith('playbackStatusUpdate', expect.any(Function));
  });

  it('setAudioModeAsync が終わるまで play しない', async () => {
    const mode = deferred<void>();
    setAudioModeAsyncMock.mockReturnValue(mode.promise as never);
    const player = mockPlayer();
    createAudioPlayerMock.mockReturnValue(player as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await flush();
    expect(createAudioPlayerMock).not.toHaveBeenCalled();
    expect(player.play).not.toHaveBeenCalled();

    mode.resolve();
    await flush();
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it('連続タップでも毎回新しいプレイヤーで play する', async () => {
    const a = mockPlayer();
    const b = mockPlayer();
    createAudioPlayerMock.mockReturnValueOnce(a as never).mockReturnValueOnce(b as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    tapSound();
    await flush();

    expect(createAudioPlayerMock).toHaveBeenCalledTimes(2);
    expect(a.play).toHaveBeenCalledTimes(1);
    expect(b.play).toHaveBeenCalledTimes(1);
  });

  it('連打でも毎回 play する', async () => {
    useSettingsStore.setState({ sound: true });
    for (let i = 0; i < 5; i++) tapSound();
    await flush();
    expect(createAudioPlayerMock).toHaveBeenCalledTimes(5);
  });

  it('didJustFinish で player.remove する', async () => {
    const player = mockPlayer();
    createAudioPlayerMock.mockReturnValue(player as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await flush();
    player.emit({ didJustFinish: true });
    expect(player.remove).toHaveBeenCalled();
  });

  it('空：オフ（既定）なら鳴らさない', () => {
    setTapSoundPlayerForTests(playerFn);
    tapSound();
    expect(playerFn).not.toHaveBeenCalled();
    expect(createAudioPlayerMock).not.toHaveBeenCalled();
  });

  it('差し替えプレイヤーは毎回呼ばれる', () => {
    setTapSoundPlayerForTests(playerFn);
    useSettingsStore.setState({ sound: true });
    tapSound();
    tapSound();
    expect(playerFn).toHaveBeenCalledTimes(2);
  });

  it('再生エラーでも投げない', () => {
    useSettingsStore.setState({ sound: true });
    setTapSoundPlayerForTests(() => {
      throw new Error('audio');
    });
    expect(() => tapSound()).not.toThrow();
  });

  it('createAudioPlayer が失敗しても投げない', async () => {
    createAudioPlayerMock.mockImplementation(() => {
      throw new Error('native');
    });
    useSettingsStore.setState({ sound: true });
    expect(() => tapSound()).not.toThrow();
    await flush();
  });

  it('同時再生の上限を超えたら古いプレイヤーを解放する', async () => {
    const players = Array.from({ length: TAP_SOUND_MAX_LIVE + 1 }, () => mockPlayer());
    players.forEach((p) => createAudioPlayerMock.mockReturnValueOnce(p as never));
    useSettingsStore.setState({ sound: true });

    for (let i = 0; i < TAP_SOUND_MAX_LIVE + 1; i++) tapSound();
    await flush();

    expect(players[0].remove).toHaveBeenCalled();
    expect(players[TAP_SOUND_MAX_LIVE].play).toHaveBeenCalledTimes(1);
  });
});
