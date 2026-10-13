import { createAudioPlayer } from 'expo-audio';

import { useSettingsStore } from '@/features/settings/store';

import {
  resetTapSoundForTests,
  setTapSoundPlayerForTests,
  TAP_SOUND_POOL_SIZE,
  tapSound,
} from '../sound';

const createAudioPlayerMock = createAudioPlayer as jest.MockedFunction<typeof createAudioPlayer>;

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
  return {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    remove: jest.fn(),
  };
}

describe('tapSound', () => {
  const playerFn = jest.fn();

  beforeEach(() => {
    playerFn.mockReset();
    resetTapSoundForTests();
    createAudioPlayerMock.mockReset();
    createAudioPlayerMock.mockImplementation(() => mockPlayer() as never);
    useSettingsStore.setState({ haptics: true, sound: false, keepAwake: true, error: null });
  });

  afterEach(() => {
    resetTapSoundForTests();
  });

  it('通常：オンなら再生する（差し替えプレイヤー）', () => {
    setTapSoundPlayerForTests(playerFn);
    useSettingsStore.setState({ sound: true });
    tapSound();
    expect(playerFn).toHaveBeenCalledTimes(1);
  });

  it('通常：オンなら pause → seekTo(0) 完了後に play する', async () => {
    const seek = deferred<void>();
    const play = jest.fn();
    const pause = jest.fn();
    const seekTo = jest.fn(() => seek.promise);
    createAudioPlayerMock.mockReturnValue({ play, pause, seekTo, remove: jest.fn() } as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    await Promise.resolve();

    expect(pause).toHaveBeenCalledTimes(1);
    expect(seekTo).toHaveBeenCalledWith(0);
    expect(play).not.toHaveBeenCalled();

    seek.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('連続タップでも毎回 play する', async () => {
    const a = mockPlayer();
    const b = mockPlayer();
    const c = mockPlayer();
    createAudioPlayerMock
      .mockReturnValueOnce(a as never)
      .mockReturnValueOnce(b as never)
      .mockReturnValueOnce(c as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    tapSound();
    await Promise.resolve();
    await Promise.resolve();

    expect(a.play).toHaveBeenCalledTimes(1);
    expect(b.play).toHaveBeenCalledTimes(1);
    expect(a.seekTo).toHaveBeenCalledWith(0);
    expect(b.seekTo).toHaveBeenCalledWith(0);
  });

  it('連打：プールを回して毎回 play する', async () => {
    const players = [mockPlayer(), mockPlayer(), mockPlayer()];
    createAudioPlayerMock
      .mockReturnValueOnce(players[0] as never)
      .mockReturnValueOnce(players[1] as never)
      .mockReturnValueOnce(players[2] as never);
    useSettingsStore.setState({ sound: true });

    for (let i = 0; i < 6; i++) tapSound();
    await Promise.resolve();
    await Promise.resolve();

    expect(createAudioPlayerMock).toHaveBeenCalledTimes(TAP_SOUND_POOL_SIZE);
    expect(players[0].play).toHaveBeenCalledTimes(2);
    expect(players[1].play).toHaveBeenCalledTimes(2);
    expect(players[2].play).toHaveBeenCalledTimes(2);
    expect(players[0].pause).toHaveBeenCalled();
    expect(players[1].pause).toHaveBeenCalled();
    expect(players[2].pause).toHaveBeenCalled();
  });

  it('空：オフ（既定）なら鳴らさない', () => {
    setTapSoundPlayerForTests(playerFn);
    tapSound();
    expect(playerFn).not.toHaveBeenCalled();
    expect(createAudioPlayerMock).not.toHaveBeenCalled();
  });

  it('再生エラーでも投げない', () => {
    useSettingsStore.setState({ sound: true });
    setTapSoundPlayerForTests(() => {
      throw new Error('audio');
    });
    expect(() => tapSound()).not.toThrow();
  });

  it('seekTo が失敗しても投げない', async () => {
    createAudioPlayerMock.mockReturnValue({
      play: jest.fn(),
      pause: jest.fn(),
      seekTo: () => Promise.reject(new Error('seek')),
      remove: jest.fn(),
    } as never);
    useSettingsStore.setState({ sound: true });
    expect(() => tapSound()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });
});
