import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

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

  // 行全体の長押しで編集シートを開く（RNGHジェスチャー）
  const rowLongPress = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      runOnJS(openEditSheet)();
    });

  // ドラッグハンドルの長押しでドラッグを開始
  const dragHandleLongPress = onDrag
    ? Gesture.LongPress()
        .minDuration(100)
        .onStart(() => {
          runOnJS(longPressHaptic)();
          runOnJS(onDrag)();
        })
    : null;

  return (
    <GestureDetector gesture={rowLongPress}>
      <View
        testID={`counter-row-${id}`}
        accessibilityLabel={`${counter.name}、数 ${counter.count}`}
        className="h-14 flex-row items-center gap-2 border-b border-divider bg-surface pl-3.5 pr-1.5"
        accessibilityHint="長押しで編集">
        {onDrag && dragHandleLongPress && (
          <GestureDetector gesture={dragHandleLongPress}>
            <View
              testID={`drag-handle-${id}`}
              accessibilityRole="button"
              accessibilityLabel="ドラッグして並べ替え"
              className="h-11 w-8 -ml-1 shrink-0 items-center justify-center">
              <DragHandleIcon color={c.inkSubtle} size={20} />
            </View>
          </GestureDetector>
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
          testID={`row-decrement-${id}`}
          accessibilityRole="button"
          accessibilityLabel={`${counter.name}を1減らす`}
          onPress={() => {
            if (decrement(id)) tapHaptic();
          }}
          disabled={isActive}
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
          testID={`row-increment-${id}`}
          accessibilityRole="button"
          accessibilityLabel={`${counter.name}を1増やす`}
          onPress={() => {
            if (increment(id)) tapHaptic();
          }}
          disabled={isActive}
          className="h-11 w-14 shrink-0 items-center justify-center rounded-control bg-accent active:opacity-80">
          <PlusIcon color={c.onAccent} />
        </Pressable>
      </View>
    </GestureDetector>
  );
});
