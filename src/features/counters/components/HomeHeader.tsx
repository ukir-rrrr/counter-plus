import { Pressable, Text, View } from 'react-native';

import { ChevronDownIcon, MenuIcon, SettingsIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';

// カテゴリ一覧（ステップ4）と設定（ステップ6）への遷移は、画面ができてから付ける
export function HomeHeader({ categoryName }: { categoryName: string }) {
  const c = useThemeColors();
  return (
    <View className="flex-row items-center justify-between px-2.5 pb-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="カテゴリ一覧"
        className="h-11 w-11 items-center justify-center rounded-control">
        <MenuIcon color={c.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="カテゴリを切り替え"
        className="h-11 shrink flex-row items-center gap-1 rounded-control px-3">
        <Text numberOfLines={1} className="shrink font-sans-bold text-title text-ink">
          {categoryName}
        </Text>
        <ChevronDownIcon color={c.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="設定"
        className="h-11 w-11 items-center justify-center rounded-control">
        <SettingsIcon color={c.ink} />
      </Pressable>
    </View>
  );
}
