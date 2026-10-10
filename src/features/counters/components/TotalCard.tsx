import { Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';

import { selectTotal, useCountersStore } from '../store';

export function TotalCard() {
  const c = useThemeColors();
  const total = useCountersStore(selectTotal);
  const itemCount = useCountersStore((s) => s.ids.length);

  return (
    <View className="mx-screen mb-3 mt-1 flex-row items-end justify-between rounded-card border border-border bg-surface px-[18px] py-3.5">
      <View className="gap-0.5">
        <Text className="font-sans text-label text-ink-muted">合計</Text>
        <Text className="font-mono-semibold text-total text-ink" style={{ fontVariant: ['tabular-nums'] }}>
          {total}
        </Text>
      </View>
      <View className="items-end gap-1.5">
        <View className="flex-row items-center gap-1 rounded-full bg-accent-soft px-2 py-[3px]">
          <CheckIcon color={c.accentInk} />
          <Text className="font-sans-medium text-hint text-accent-ink">自動保存済み</Text>
        </View>
        <Text className="font-sans text-label text-ink-muted">{itemCount} 項目</Text>
      </View>
    </View>
  );
}
