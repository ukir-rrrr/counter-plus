import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/features/settings/store';

/** ＋・−を押したときの振動（設定がオンのときだけ） */
export function tapHaptic(): void {
  if (!useSettingsStore.getState().haptics) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
