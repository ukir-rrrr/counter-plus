import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DragHandleIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { itemColors, type ItemColor } from '@/constants/theme';
import { useThemeColors } from '@/constants/use-theme-colors';
import { longPressHaptic, tapHaptic } from '@/lib/haptics';

import { useCountersStore } from '../store';

type CounterRowProps = {
  id: string;
  /** ドラッグハンドルを表示し、長押しでドラッグを開始する */
  onDrag?: () => void;
  isActive?: boolean;
};

export const CounterRow = memo(function CounterRow({ id, onDrag, isActive }: CounterRowProps) {
  const c = useThemeColors();
  const counter = useCountersStore((s) => s.byId[id]);
  const increment = useCountersStore((s) => s.increment);
  const decrement = useCountersStore((s) => s.decrement);
  if (!counter) return null;

  const dotColor = itemColors[counter.color as ItemColor] ?? itemColors.gray;

  const openEditSheet = () => {
    longPressHaptic();
    router.push({ pathname: '/counter/[id]', params: { id } });
  };

  return (
    <Pressable
      accessibilityHint="長押しで編集"
      onLongPress={openEditSheet}
      delayLongPress={200}
      disabled={isActive}
      className="h-14 flex-row items-center gap-2 border-b border-divider bg-surface pl-3.5 pr-1.5 active:bg-background">
      {onDrag && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ドラッグして並べ替え"
          onLongPress={() => {
            longPressHaptic();
            onDrag();
          }}
          delayLongPress={100}
          className="h-11 w-8 -ml-1 shrink-0 items-center justify-center active:opacity-70">
          <DragHandleIcon color={c.inkSubtle} size={20} />
        </Pressable>
      )}
      <View className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
      <View className="min-w-0 flex-1 gap-px">
        <Text numberOfLines={1} className="font-sans-medium text-body-sm text-ink">
          {counter.name}
        </Text>
        {counter.memo !== '' && (
          <Text numberOfLines={1} className="font-sans text-hint text-ink-subtle">
            {counter.memo}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${counter.name}を1減らす`}
        onPress={() => {
          if (decrement(id)) tapHaptic();
        }}
        className="h-11 w-11 shrink-0 items-center justify-center rounded-control bg-neutral-button active:opacity-70">
        <MinusIcon color={c.ink} />
      </Pressable>
      <Text
        className="w-[52px] shrink-0 text-center font-mono-semibold text-count text-ink"
        style={{ fontVariant: ['tabular-nums'] }}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {counter.count}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${counter.name}を1増やす`}
        onPress={() => {
          if (increment(id)) tapHaptic();
        }}
        className="h-11 w-14 shrink-0 items-center justify-center rounded-control bg-accent active:opacity-80">
        <PlusIcon color={c.onAccent} />
      </Pressable>
    </Pressable>
  );
});
