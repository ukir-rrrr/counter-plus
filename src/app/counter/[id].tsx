import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius } from '@/constants/theme';
import { useThemeColors } from '@/constants/use-theme-colors';
import { AutoSaveNote } from '@/features/counters/components/edit/AutoSaveNote';
import { CategoryPicker } from '@/features/counters/components/edit/CategoryPicker';
import { ColorPicker } from '@/features/counters/components/edit/ColorPicker';
import { CountAdjuster } from '@/features/counters/components/edit/CountAdjuster';
import { DangerActions } from '@/features/counters/components/edit/DangerActions';
import { EditHeader } from '@/features/counters/components/edit/EditHeader';
import { LabeledInput } from '@/features/counters/components/edit/LabeledInput';
import { UndoToast } from '@/features/counters/components/UndoToast';
import { useCountersStore } from '@/features/counters/store';
import { tapHaptic } from '@/lib/haptics';

function Backdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />;
}

// 項目の編集シート。透明なモーダル画面の上に @gorhom/bottom-sheet を出す（ADR 0011）
export default function EditCounter() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetRef = useRef<BottomSheet>(null);
  const leaving = useRef(false);

  const counter = useCountersStore((s) => s.byId[id]);
  const update = useCountersStore((s) => s.update);
  const move = useCountersStore((s) => s.move);
  const reset = useCountersStore((s) => s.reset);
  const remove = useCountersStore((s) => s.remove);
  // 名前を空にしたまま離れたときに戻す名前
  const [initialName] = useState(counter?.name ?? '');

  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  // 存在しない項目を開いたときはすぐ戻る
  useEffect(() => {
    if (!counter && !leaving.current) leave();
  });

  if (!counter) return null;

  const close = () => sheetRef.current?.close();

  const confirmDelete = () => {
    Alert.alert('この項目を削除しますか？', `「${counter.name}」と、これまでの履歴も削除されます。元に戻せません。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          // Alert後に close() を呼んでも onClose が発火しないことがあるため、
          // 削除とナビゲーションを直接行う
          remove(id);
          if (router.canGoBack()) router.back();
          else router.replace('/');
        },
      },
    ]);
  };

  return (
    <BottomSheet
      ref={sheetRef}
      enablePanDownToClose
      enableDynamicSizing
      maxDynamicContentSize={height - insets.top}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={Backdrop}
      onClose={leave}
      backgroundStyle={{ backgroundColor: c.surface, borderRadius: radius.sheet }}
      handleIndicatorStyle={{ backgroundColor: c.border, width: 36, height: 5 }}
      accessibilityLabel="項目を編集">
      <BottomSheetScrollView keyboardShouldPersistTaps="handled">
        <View className="gap-4 px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
          <EditHeader onDone={close} />
          <CountAdjuster id={id} />
          <LabeledInput
            testID="name-input"
            label="項目名"
            value={counter.name}
            onChangeText={(name) => update(id, { name })}
            onBlur={() => {
              if (counter.name.trim() === '') update(id, { name: initialName });
            }}
          />
          <LabeledInput
            testID="memo-input"
            label="メモ（置き場所など）"
            value={counter.memo}
            onChangeText={(memo) => update(id, { memo })}
            placeholder="例：棚上段"
          />
          <ColorPicker value={counter.color} onChange={(color) => update(id, { color })} />
          <CategoryPicker value={counter.categoryId} onChange={(categoryId) => move(id, categoryId)} />
          <DangerActions
            onReset={() => {
              if (reset(id)) tapHaptic();
            }}
            onDelete={confirmDelete}
          />
          <UndoToast />
          <AutoSaveNote />
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
