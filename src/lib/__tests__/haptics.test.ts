import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/features/settings/store';

import { longPressHaptic, tapHaptic } from '../haptics';

describe('haptics', () => {
  const impact = Haptics.impactAsync as jest.MockedFunction<typeof Haptics.impactAsync>;

  beforeEach(() => {
    impact.mockReset();
    impact.mockResolvedValue();
    useSettingsStore.setState({ haptics: true, keepAwake: true, error: null });
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

  it('長押しは Medium で振動する', () => {
    longPressHaptic();
    expect(impact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });
});
