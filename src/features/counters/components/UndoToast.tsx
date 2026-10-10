import { Pressable, Text, View } from 'react-native';

import { useCountersStore } from '../store';

/** リセットの直後だけ「元に戻す」を出す（数秒で消える） */
export function UndoToast() {
  const name = useCountersStore((s) => (s.pendingUndo ? (s.byId[s.pendingUndo.counterId]?.name ?? '') : null));
  const undoReset = useCountersStore((s) => s.undoReset);
  if (name === null) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      className="h-12 flex-row items-center justify-between gap-2 rounded-control bg-accent-soft pl-3.5">
      <Text numberOfLines={1} className="flex-1 font-sans text-body-sm text-accent-ink">
        「{name}」を0にリセットしました
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={undoReset}
        className="h-12 justify-center px-3.5 active:opacity-70">
        <Text className="font-sans-bold text-body-sm text-accent">元に戻す</Text>
      </Pressable>
    </View>
  );
}
