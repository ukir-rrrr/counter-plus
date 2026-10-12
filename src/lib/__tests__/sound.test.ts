import { useSettingsStore } from '@/features/settings/store';

import { setTapSoundPlayerForTests, tapSound } from '../sound';

describe('tapSound', () => {
  const player = jest.fn();

  beforeEach(() => {
    player.mockReset();
    setTapSoundPlayerForTests(player);
    useSettingsStore.setState({ haptics: true, sound: false, keepAwake: true, error: null });
  });

  afterEach(() => {
    setTapSoundPlayerForTests(null);
  });

  it('通常：オンなら再生する', () => {
    useSettingsStore.setState({ sound: true });
    tapSound();
    expect(player).toHaveBeenCalledTimes(1);
  });

  it('空：オフ（既定）なら鳴らさない', () => {
    tapSound();
    expect(player).not.toHaveBeenCalled();
  });

  it('再生エラーでも投げない', () => {
    useSettingsStore.setState({ sound: true });
    setTapSoundPlayerForTests(() => {
      throw new Error('audio');
    });
    expect(() => tapSound()).not.toThrow();
  });

  it('連打しても毎回再生を試みる', () => {
    useSettingsStore.setState({ sound: true });
    tapSound();
    tapSound();
    tapSound();
    expect(player).toHaveBeenCalledTimes(3);
  });
});
