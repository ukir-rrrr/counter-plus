import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/features/settings/store';

import { tapSound } from './sound';

/** ＋・−を押したときの振動（設定がオンのときだけ）。タップ音も同じタイミングで鳴らす */
export function tapHaptic(): void {
  if (useSettingsStore.getState().haptics) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
  tapSound();
}

/** 行を長押ししたときの振動（設定がオンのときだけ） */
export function longPressHaptic(): void {
  if (!useSettingsStore.getState().haptics) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
