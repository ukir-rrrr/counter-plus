import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChevronDownIcon, MenuIcon, SettingsIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';

export function HomeHeader({
  categoryName,
  onCategoryPress,
}: {
  categoryName: string;
  onCategoryPress?: () => void;
}) {
  const c = useThemeColors();

  const goToCategories = () => {
    router.push('/categories');
  };

  return (
    <View className="flex-row items-center justify-between px-2.5 pb-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="カテゴリ一覧"
        onPress={goToCategories}
        className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
        <MenuIcon color={c.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="カテゴリを切り替え"
        onPress={onCategoryPress ?? goToCategories}
        className="h-11 shrink flex-row items-center gap-1 rounded-control px-3 active:opacity-70">
        <Text numberOfLines={1} className="shrink font-sans-bold text-title text-ink">
          {categoryName}
        </Text>
        <ChevronDownIcon color={c.ink} />
      </Pressable>
      <Pressable
        testID="home-settings"
        accessibilityRole="button"
        accessibilityLabel="設定"
        onPress={() => router.push('/settings')}
        className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
        <SettingsIcon color={c.ink} />
      </Pressable>
    </View>
  );
}
