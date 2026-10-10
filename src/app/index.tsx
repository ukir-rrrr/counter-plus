import { useKeepAwake } from 'expo-keep-awake';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listCategories } from '@/features/categories/repository';
import { AdPlaceholder } from '@/features/counters/components/AdPlaceholder';
import { AddCounterButton } from '@/features/counters/components/AddCounterButton';
import { CounterRow } from '@/features/counters/components/CounterRow';
import { HomeHeader } from '@/features/counters/components/HomeHeader';
import { Toolbar } from '@/features/counters/components/Toolbar';
import { TotalCard } from '@/features/counters/components/TotalCard';
import { UndoToast } from '@/features/counters/components/UndoToast';
import { useCountersStore } from '@/features/counters/store';
import { useSettingsStore } from '@/features/settings/store';

function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const [categoryName, setCategoryName] = useState('');
  const ids = useCountersStore((s) => s.ids);
  const load = useCountersStore((s) => s.load);
  const keepAwake = useSettingsStore((s) => s.keepAwake);

  // カテゴリの切り替えはステップ4。今は先頭のカテゴリを表示する
  useEffect(() => {
    listCategories().then((rows) => {
      const first = rows[0];
      if (!first) return;
      setCategoryName(first.name);
      load(first.id);
    });
  }, [load]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      {keepAwake && <KeepAwake />}
      <HomeHeader categoryName={categoryName} />
      <TotalCard />
      <View className="mx-screen flex-1">
        <FlatList
          data={ids}
          keyExtractor={(id) => id}
          renderItem={({ item }) => <CounterRow id={item} />}
          ListFooterComponent={AddCounterButton}
          className="grow-0 rounded-card border border-border bg-surface"
        />
        {/* 編集シートでリセットしてすぐ閉じても、ここで取り消せる */}
        <View className="absolute bottom-2 left-2 right-2">
          <UndoToast />
        </View>
      </View>
      <Text className="px-screen pt-2 text-center font-sans text-hint text-ink-subtle">行を長押しで編集・並べ替え</Text>
      <Toolbar />
      <AdPlaceholder />
      <View style={{ height: insets.bottom }} />
    </View>
  );
}
