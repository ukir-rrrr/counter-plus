import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { ClockIcon, DownloadIcon, SortIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { autoSortCounters } from '@/features/categories/repository';
import { ProBadge } from '@/features/purchases/components/ProBadge';
import { useCountersStore } from '@/features/counters/store';
import { tapHaptic } from '@/lib/haptics';
import { requireProOrOpenPaywall, useIsPro } from '@/lib/purchases';

export function Toolbar() {
  const c = useThemeColors();
  const isPro = useIsPro();
  const categoryId = useCountersStore((s) => s.categoryId);
  const load = useCountersStore((s) => s.load);

  const handleSort = () => {
    void requireProOrOpenPaywall('sort').then((ok) => {
      if (!ok || !categoryId) return;

      Alert.alert('並べ替え', '項目の並び順を選んでください', [
        {
          text: '名前順',
          onPress: async () => {
            autoSortCounters(categoryId, 'name');
            await load(categoryId);
            tapHaptic();
          },
        },
        {
          text: '数の多い順',
          onPress: async () => {
            autoSortCounters(categoryId, 'most');
            await load(categoryId);
            tapHaptic();
          },
        },
        {
          text: '数の少ない順',
          onPress: async () => {
            autoSortCounters(categoryId, 'least');
            await load(categoryId);
            tapHaptic();
          },
        },
        { text: 'キャンセル', style: 'cancel' },
      ]);
    });
  };

  return (
    <View className="flex-row gap-2 px-screen pb-3 pt-2.5">
      <Pressable
        testID="toolbar-history"
        accessibilityRole="button"
        accessibilityLabel={isPro ? '履歴' : '履歴（Pro）'}
        onPress={() => {
          void requireProOrOpenPaywall('history').then((ok) => {
            if (!ok) return;
            router.push('/history');
          });
        }}
        className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-control border border-border bg-surface active:opacity-70">
        <ClockIcon color={c.ink} />
        <Text className="font-sans-medium text-label text-ink">履歴</Text>
        {!isPro ? <ProBadge /> : null}
      </Pressable>
      <Pressable
        testID="toolbar-export"
        accessibilityRole="button"
        accessibilityLabel={isPro ? 'CSV出力' : 'CSV出力（Pro）'}
        onPress={() => {
          void requireProOrOpenPaywall('csv').then((ok) => {
            if (!ok) return;
            router.push('/export');
          });
        }}
        className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-control border border-border bg-surface active:opacity-70">
        <DownloadIcon color={c.ink} />
        <Text className="font-sans-medium text-label text-ink">CSV出力</Text>
        {!isPro ? <ProBadge /> : null}
      </Pressable>
      <Pressable
        testID="toolbar-sort"
        accessibilityRole="button"
        accessibilityLabel={isPro ? '並べ替え' : '並べ替え（Pro）'}
        onPress={handleSort}
        className="h-11 w-11 items-center justify-center rounded-control border border-border bg-surface active:opacity-70">
        <SortIcon color={c.ink} />
      </Pressable>
    </View>
  );
}
