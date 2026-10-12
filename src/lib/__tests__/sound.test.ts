import { createAudioPlayer } from 'expo-audio';

import { useSettingsStore } from '@/features/settings/store';

import { resetTapSoundForTests, setTapSoundPlayerForTests, tapSound } from '../sound';

const createAudioPlayerMock = createAudioPlayer as jest.MockedFunction<typeof createAudioPlayer>;

describe('tapSound', () => {
  const playerFn = jest.fn();

  beforeEach(() => {
    playerFn.mockReset();
    resetTapSoundForTests();
    createAudioPlayerMock.mockClear();
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

  it('通常：オンなら expo-audio で先頭から再生する', () => {
    const play = jest.fn();
    const seekTo = jest.fn();
    createAudioPlayerMock.mockReturnValue({ play, seekTo, remove: jest.fn() } as never);
    useSettingsStore.setState({ sound: true });

    tapSound();

    expect(createAudioPlayerMock).toHaveBeenCalledTimes(1);
    expect(seekTo).toHaveBeenCalledWith(0);
    expect(play).toHaveBeenCalledTimes(1);
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

  it('expo-audio の play が失敗しても投げない', () => {
    createAudioPlayerMock.mockReturnValue({
      play: () => {
        throw new Error('native');
      },
      seekTo: jest.fn(),
      remove: jest.fn(),
    } as never);
    useSettingsStore.setState({ sound: true });
    expect(() => tapSound()).not.toThrow();
  });

  it('連打しても毎回先頭から再生する', () => {
    const play = jest.fn();
    const seekTo = jest.fn();
    createAudioPlayerMock.mockReturnValue({ play, seekTo, remove: jest.fn() } as never);
    useSettingsStore.setState({ sound: true });

    tapSound();
    tapSound();
    tapSound();

    expect(createAudioPlayerMock).toHaveBeenCalledTimes(1);
    expect(seekTo).toHaveBeenCalledTimes(3);
    expect(play).toHaveBeenCalledTimes(3);
  });
});
