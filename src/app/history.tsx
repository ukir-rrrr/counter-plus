import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCategoriesStore } from '@/features/categories/store';
import { FilterChips } from '@/features/history/components/FilterChips';
import { HistoryHeader } from '@/features/history/components/HistoryHeader';
import { HistoryList } from '@/features/history/components/HistoryList';
import { filterEventsByCategory, groupHistoryByDate } from '@/features/history/group';
import { useHistoryStore } from '@/features/history/store';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [filterId, setFilterId] = useState<string | null>(null);

  const categories = useCategoriesStore((s) => s.categories);
  const categoriesLoad = useCategoriesStore((s) => s.load);
  const events = useHistoryStore((s) => s.events);
  const viewedAt = useHistoryStore((s) => s.viewedAt);
  const error = useHistoryStore((s) => s.error);
  const historyLoad = useHistoryStore((s) => s.load);

  useFocusEffect(
    useCallback(() => {
      categoriesLoad();
      historyLoad();
    }, [categoriesLoad, historyLoad]),
  );

  const items = useMemo(() => {
    const filtered = filterEventsByCategory(events, filterId);
    return groupHistoryByDate(filtered, viewedAt);
  }, [events, filterId, viewedAt]);

  const emptyMessage =
    error ??
    (events.length === 0
      ? 'まだ履歴がありません'
      : 'このカテゴリの履歴はありません');

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <HistoryHeader onExport={() => router.push('/export')} />
      <FilterChips categories={categories} selectedId={filterId} onSelect={setFilterId} />
      <HistoryList items={items} emptyMessage={emptyMessage} />
      <Text className="px-screen pb-2 pt-2.5 text-center font-sans text-hint text-ink-subtle">
        ＋・−・編集・リセットをすべて時刻つきで記録しています
      </Text>
      <View style={{ height: insets.bottom }} />
    </View>
  );
}
