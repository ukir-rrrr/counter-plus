import { createAudioPlayer, preload, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

import { useSettingsStore } from '@/features/settings/store';

import {
  getTapSoundDebugEvents,
  preloadTapSound,
  resetTapSoundForTests,
  setTapSoundPlayerForTests,
  TAP_SOUND_POOL_SIZE,
  tapSound,
} from '../sound';

const createAudioPlayerMock = createAudioPlayer as jest.MockedFunction<typeof createAudioPlayer>;
const setAudioModeAsyncMock = setAudioModeAsync as jest.MockedFunction<typeof setAudioModeAsync>;
const setIsAudioActiveAsyncMock = setIsAudioActiveAsync as jest.MockedFunction<typeof setIsAudioActiveAsync>;
const preloadMock = preload as jest.MockedFunction<typeof preload>;

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockPlayer(overrides: { isLoaded?: boolean } = {}) {
  const loaded = overrides.isLoaded ?? true;
  const listeners: ((status: { didJustFinish?: boolean; isLoaded?: boolean }) => void)[] = [];
  return {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    replace: jest.fn(),
    remove: jest.fn(),
    playing: false,
    isLoaded: loaded,
    currentTime: 0,
    currentStatus: { playing: false, didJustFinish: false, currentTime: 0, isLoaded: loaded },
    addListener: jest.fn((_event: string, cb: (status: { didJustFinish?: boolean; isLoaded?: boolean }) => void) => {
      listeners.push(cb);
      return { remove: jest.fn() };
    }),
    emit(status: { didJustFinish?: boolean; isLoaded?: boolean }) {
      if (status.isLoaded != null) {
        this.isLoaded = status.isLoaded;
        this.currentStatus.isLoaded = status.isLoaded;
      }
      for (const cb of listeners) cb(status);
    },
  };
}

async function flush(): Promise<void> {
  for (let i = 0; i < 12; i++) {
    await Promise.resolve();
  }
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
    setIsAudioActiveAsyncMock.mockReset();
    setIsAudioActiveAsyncMock.mockResolvedValue(undefined as never);
    preloadMock.mockReset();
    preloadMock.mockResolvedValue(undefined as never);
    useSettingsStore.setState({ haptics: true, sound: false, keepAwake: true, error: null });
  });

  afterEach(() => {
    resetTapSoundForTests();
  });

  it('通常：オンならモード設定とプリロードのあと seekTo して play する', async () => {
    const a = mockPlayer();
    const b = mockPlayer();
    createAudioPlayerMock.mockReturnValueOnce(a as never).mockReturnValueOnce(b as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await flush();

    expect(setAudioModeAsyncMock).toHaveBeenCalled();
    expect(setIsAudioActiveAsyncMock).toHaveBeenCalledWith(true);
    expect(preloadMock).toHaveBeenCalled();
    expect(createAudioPlayerMock).toHaveBeenCalledTimes(TAP_SOUND_POOL_SIZE);
    expect(createAudioPlayerMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ keepAudioSessionActive: true })
    );
    expect(a.seekTo).toHaveBeenCalledWith(0);
    expect(a.play).toHaveBeenCalledTimes(1);
    expect(a.remove).not.toHaveBeenCalled();
    expect(b.remove).not.toHaveBeenCalled();
  });

  it('setAudioModeAsync が終わるまで play しない', async () => {
    const mode = deferred<void>();
    setAudioModeAsyncMock.mockReturnValue(mode.promise as never);
    const a = mockPlayer();
    createAudioPlayerMock.mockReturnValue(a as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await flush();
    expect(createAudioPlayerMock).not.toHaveBeenCalled();
    expect(a.play).not.toHaveBeenCalled();

    mode.resolve();
    await flush();
    expect(a.play).toHaveBeenCalledTimes(1);
  });

  it('isLoaded になるまで play しない', async () => {
    const a = mockPlayer({ isLoaded: false });
    const b = mockPlayer({ isLoaded: false });
    createAudioPlayerMock.mockReturnValueOnce(a as never).mockReturnValueOnce(b as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await flush();
    expect(a.play).not.toHaveBeenCalled();

    a.emit({ isLoaded: true });
    b.emit({ isLoaded: true });
    await flush();
    expect(a.seekTo).toHaveBeenCalledWith(0);
    expect(a.play).toHaveBeenCalledTimes(1);
  });

  it('連続タップでも同じプールを使い、毎回 seekTo して play する', async () => {
    const a = mockPlayer();
    const b = mockPlayer();
    createAudioPlayerMock.mockReturnValueOnce(a as never).mockReturnValueOnce(b as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await flush();
    expect(a.play).toHaveBeenCalledTimes(1);

    tapSound();
    await flush();
    expect(createAudioPlayerMock).toHaveBeenCalledTimes(TAP_SOUND_POOL_SIZE);
    expect(a.play).toHaveBeenCalledTimes(2);
    expect(a.seekTo).toHaveBeenCalledTimes(2);
    expect(a.remove).not.toHaveBeenCalled();
  });

  it('再生中ならもう一方のプレイヤーを使う', async () => {
    const a = mockPlayer();
    const b = mockPlayer();
    createAudioPlayerMock.mockReturnValueOnce(a as never).mockReturnValueOnce(b as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await flush();
    a.playing = true;
    a.currentStatus.playing = true;

    tapSound();
    await flush();
    expect(b.seekTo).toHaveBeenCalledWith(0);
    expect(b.play).toHaveBeenCalledTimes(1);
  });

  it('連打でも毎回 play する', async () => {
    const a = mockPlayer();
    const b = mockPlayer();
    createAudioPlayerMock.mockReturnValueOnce(a as never).mockReturnValueOnce(b as never);
    useSettingsStore.setState({ sound: true });
    for (let i = 0; i < 5; i++) tapSound();
    await flush();
    expect(a.play.mock.calls.length + b.play.mock.calls.length).toBe(5);
  });

  it('起動プリロードはプレイヤーを先に作る', async () => {
    const a = mockPlayer();
    const b = mockPlayer();
    createAudioPlayerMock.mockReturnValueOnce(a as never).mockReturnValueOnce(b as never);
    preloadTapSound();
    await flush();
    expect(createAudioPlayerMock).toHaveBeenCalledTimes(TAP_SOUND_POOL_SIZE);
    expect(a.play).not.toHaveBeenCalled();
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

  it('デバッグ履歴は直近5件で seq / isLoaded / playing を残す', async () => {
    const a = mockPlayer();
    const b = mockPlayer();
    createAudioPlayerMock.mockReturnValueOnce(a as never).mockReturnValueOnce(b as never);
    useSettingsStore.setState({ sound: true });
    for (let i = 0; i < 6; i++) tapSound();
    await flush();
    const events = getTapSoundDebugEvents();
    expect(events).toHaveLength(5);
    expect(events[0]?.seq).toBe(2);
    expect(events[4]?.seq).toBe(6);
    expect(events[4]).toEqual(
      expect.objectContaining({
        isLoaded: true,
        playing: false,
        extra: 'seek+play',
      })
    );
  });
});
