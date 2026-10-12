import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { ClockIcon, DownloadIcon, SortIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { autoSortCounters } from '@/features/categories/repository';
import { useCountersStore } from '@/features/counters/store';
import { tapHaptic } from '@/lib/haptics';

function ProBadge() {
  return (
    <View className="rounded bg-accent px-[5px] py-px">
      <Text className="font-sans-bold text-hint tracking-wide text-on-accent">PRO</Text>
    </View>
  );
}

export function Toolbar() {
  const c = useThemeColors();
  const categoryId = useCountersStore((s) => s.categoryId);
  const load = useCountersStore((s) => s.load);

  const handleSort = () => {
    if (!categoryId) return;

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
  };

  return (
    <View className="flex-row gap-2 px-screen pb-3 pt-2.5">
      <Pressable
        testID="toolbar-history"
        accessibilityRole="button"
        accessibilityLabel="履歴（Pro）"
        onPress={() => router.push('/history')}
        className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-control border border-border bg-surface active:opacity-70">
        <ClockIcon color={c.ink} />
        <Text className="font-sans-medium text-label text-ink">履歴</Text>
        <ProBadge />
      </Pressable>
      <Pressable
        testID="toolbar-export"
        accessibilityRole="button"
        accessibilityLabel="CSV出力（Pro）"
        onPress={() => router.push('/export')}
        className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-control border border-border bg-surface active:opacity-70">
        <DownloadIcon color={c.ink} />
        <Text className="font-sans-medium text-label text-ink">CSV出力</Text>
        <ProBadge />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="並べ替え"
        onPress={handleSort}
        className="h-11 w-11 items-center justify-center rounded-control border border-border bg-surface active:opacity-70">
        <SortIcon color={c.ink} />
      </Pressable>
    </View>
  );
}
