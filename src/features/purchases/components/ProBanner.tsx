import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { openPaywall, useIsPro, usePurchasesStore } from '@/lib/purchases';

export function ProBanner() {
  const isPro = useIsPro();
  const priceString = usePurchasesStore((s) => s.priceString);
  const c = useThemeColors();

  if (isPro) return null;

  const title = priceString ? `Proにする（買い切り ${priceString}）` : 'Proにする（買い切り）';

  return (
    <Pressable
      testID="settings-pro-banner"
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => openPaywall('settings')}
      className="mx-screen mb-2 min-h-11 flex-row items-center gap-3 rounded-card bg-accent px-4 py-3.5 active:opacity-80">
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-sans-bold text-body text-on-accent">{title}</Text>
        <Text className="font-sans text-label text-on-accent opacity-90">
          広告なし・CSV出力・履歴・カテゴリ無制限
        </Text>
      </View>
      <ChevronRightIcon color={c.onAccent} size={18} />
    </Pressable>
  );
}
