import { Alert, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { CheckCircleIcon, DragHandleIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { longPressHaptic } from '@/lib/haptics';

import type { CategoryWithStats } from '../store';
import { categoryDragHandleTestId, categoryRowTestId } from './categoryRowTestIds';

export type CategoryRowProps = {
  item: CategoryWithStats;
  /** リスト上の位置。testID に使い、実行ごとの UUID に依存しない */
  index?: number;
  isSelected: boolean;
  /** 編集モード中は通常タップで選択しない */
  isEditing?: boolean;
  isActive?: boolean;
  onDrag: () => void;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
};

/** 名前エリアの長押しで出す変更・削除の確認。ハンドルからは呼ばない */
export function openCategoryEdit(item: Pick<CategoryWithStats, 'name'>, onRename: () => void, onDelete: () => void): void {
  longPressHaptic();
  Alert.alert(item.name, undefined, [
    { text: '名前を変更', onPress: onRename },
    { text: '削除', style: 'destructive', onPress: onDelete },
    { text: 'キャンセル', style: 'cancel' },
  ]);
}

export function CategoryRow({
  item,
  index = 0,
  isSelected,
  isEditing = false,
  isActive = false,
  onDrag,
  onSelect,
  onRename,
  onDelete,
}: CategoryRowProps) {
  const c = useThemeColors();

  const handlePress = () => {
    if (isEditing || isActive) return;
    onSelect();
  };

  const openEdit = () => {
    if (isActive) return;
    openCategoryEdit(item, onRename, onDelete);
  };

  // 名前エリアの長押しで編集（ハンドルとは別のジェスチャー）
  const rowLongPress = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      runOnJS(openEdit)();
    });

  const startDrag = () => {
    longPressHaptic();
    onDrag();
  };

  return (
    <View
      testID={categoryRowTestId(index)}
      accessible={false}
      style={{ backgroundColor: isSelected ? c.accentSoft : c.surface }}
      className="min-h-16 flex-row items-center gap-2 border-b border-divider pl-2 pr-3.5">
      <Pressable
        testID={categoryDragHandleTestId(index)}
        accessibilityRole="button"
        accessibilityLabel="ドラッグして並べ替え"
        onPressIn={startDrag}
        disabled={isActive}
        className="h-11 w-11 shrink-0 items-center justify-center">
        <View
          style={{ backgroundColor: c.neutralButton }}
          className="h-9 w-9 items-center justify-center rounded-[10px]">
          <DragHandleIcon color={c.inkMuted} size={20} />
        </View>
      </Pressable>
      <GestureDetector gesture={rowLongPress}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={`${item.name}、${item.itemCount}項目、合計 ${item.total}`}
          accessibilityHint="長押しで名前の変更・削除"
          onPress={handlePress}
          onLongPress={openEdit}
          delayLongPress={200}
          disabled={isActive}
          className="min-h-11 min-w-0 flex-1 flex-row items-center gap-3 active:opacity-70">
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="font-sans-bold text-body text-ink" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="font-sans text-label text-ink-muted">{item.itemCount} 項目</Text>
          </View>
          <Text className="font-mono-semibold text-count-sm text-ink">{item.total.toLocaleString()}</Text>
          <View className="w-5.5 items-center justify-center">
            {isSelected ? <CheckCircleIcon color={c.accent} size={20} /> : null}
          </View>
        </Pressable>
      </GestureDetector>
    </View>
  );
}
