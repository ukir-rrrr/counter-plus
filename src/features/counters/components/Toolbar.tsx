import { Pressable, Text, View } from 'react-native';

import { ClockIcon, DownloadIcon, SortIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';

function ProBadge() {
  return (
    <View className="rounded bg-accent px-[5px] py-px">
      <Text className="font-sans-bold text-hint tracking-wide text-on-accent">PRO</Text>
    </View>
  );
}

// 履歴・CSV出力（ステップ5）と並べ替え（ステップ4）は、まだ押しても何もしない
export function Toolbar() {
  const c = useThemeColors();
  return (
    <View className="flex-row gap-2 px-screen pb-3 pt-2.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="履歴（Pro）"
        className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-control border border-border bg-surface">
        <ClockIcon color={c.ink} />
        <Text className="font-sans-medium text-label text-ink">履歴</Text>
        <ProBadge />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="CSV出力（Pro）"
        className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-control border border-border bg-surface">
        <DownloadIcon color={c.ink} />
        <Text className="font-sans-medium text-label text-ink">CSV出力</Text>
        <ProBadge />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="並べ替え"
        className="h-11 w-11 items-center justify-center rounded-control border border-border bg-surface">
        <SortIcon color={c.ink} />
      </Pressable>
    </View>
  );
}
