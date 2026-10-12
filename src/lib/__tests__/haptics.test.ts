import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/features/settings/store';

import { longPressHaptic, tapHaptic } from '../haptics';
import { setTapSoundPlayerForTests } from '../sound';

describe('haptics', () => {
  const impact = Haptics.impactAsync as jest.MockedFunction<typeof Haptics.impactAsync>;
  const player = jest.fn();

  beforeEach(() => {
    impact.mockReset();
    impact.mockResolvedValue();
    player.mockReset();
    setTapSoundPlayerForTests(player);
    useSettingsStore.setState({ haptics: true, sound: false, keepAwake: true, error: null });
  });

  afterEach(() => {
    setTapSoundPlayerForTests(null);
  });

  it('通常：振動オンなら impact する', () => {
    tapHaptic();
    expect(impact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('振動オフなら impact しない', () => {
    useSettingsStore.setState({ haptics: false });
    tapHaptic();
    longPressHaptic();
    expect(impact).not.toHaveBeenCalled();
  });

  it('タップ音オンなら tapHaptic で音も鳴らす', () => {
    useSettingsStore.setState({ sound: true });
    tapHaptic();
    expect(player).toHaveBeenCalledTimes(1);
  });

  it('長押しの振動は音を鳴らさない', () => {
    useSettingsStore.setState({ sound: true });
    longPressHaptic();
    expect(impact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    expect(player).not.toHaveBeenCalled();
  });
});
