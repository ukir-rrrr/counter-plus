import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { saveCounterSortOrder } from '@/features/categories/repository';
import { useCategoriesStore } from '@/features/categories/store';
import { AdPlaceholder } from '@/features/counters/components/AdPlaceholder';
import { AddCounterButton } from '@/features/counters/components/AddCounterButton';
import { CounterRow } from '@/features/counters/components/CounterRow';
import { HomeHeader } from '@/features/counters/components/HomeHeader';
import { Toolbar } from '@/features/counters/components/Toolbar';
import { TotalCard } from '@/features/counters/components/TotalCard';
import { UndoToast } from '@/features/counters/components/UndoToast';
import { useCountersStore } from '@/features/counters/store';
import { useSettingsStore } from '@/features/settings/store';
import { tapHaptic } from '@/lib/haptics';

function KeepAwake() {
  useKeepAwake();
  return null;
}

type CounterItem = { id: string };

function DraggableCounterRow({ item, drag, isActive }: RenderItemParams<CounterItem>) {
  return (
    <ScaleDecorator>
      <CounterRow id={item.id} onDrag={drag} isActive={isActive} />
    </ScaleDecorator>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const ids = useCountersStore((s) => s.ids);
  const countersLoad = useCountersStore((s) => s.load);
  const keepAwake = useSettingsStore((s) => s.keepAwake);

  const categories = useCategoriesStore((s) => s.categories);
  const selectedId = useCategoriesStore((s) => s.selectedId);
  const categoriesLoad = useCategoriesStore((s) => s.load);

  const selectedCategory = categories.find((c) => c.id === selectedId);
  const categoryName = selectedCategory?.name ?? '';

  // 画面にフォーカスが戻ったときにカテゴリと項目を読み込む
  useFocusEffect(
    useCallback(() => {
      categoriesLoad().then(() => {
        const state = useCategoriesStore.getState();
        if (state.selectedId) {
          countersLoad(state.selectedId);
        }
      });
    }, [categoriesLoad, countersLoad])
  );

  const handleDragEnd = ({ data }: { data: CounterItem[] }) => {
    const newIds = data.map((item) => item.id);
    // storeのidsを更新
    useCountersStore.setState({ ids: newIds });
    // DBに保存
    saveCounterSortOrder(newIds);
    tapHaptic();
  };

  const listData: CounterItem[] = ids.map((id) => ({ id }));

  const renderItem = useCallback(
    (params: RenderItemParams<CounterItem>) => <DraggableCounterRow {...params} />,
    []
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      {keepAwake && <KeepAwake />}
      <HomeHeader categoryName={categoryName} />
      <TotalCard />
      <View className="mx-screen flex-1">
        <DraggableFlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          activationDistance={10}
          ListFooterComponent={AddCounterButton}
          containerStyle={{ flexGrow: 0 }}
          className="grow-0 rounded-card border border-border bg-surface"
        />
        <View className="absolute bottom-2 left-2 right-2">
          <UndoToast />
        </View>
      </View>
      <Text className="px-screen pt-2 text-center font-sans text-hint text-ink-subtle">行を長押しで編集、左のハンドルで並べ替え</Text>
      <Toolbar />
      <AdPlaceholder />
      <View style={{ height: insets.bottom }} />
    </View>
  );
}
