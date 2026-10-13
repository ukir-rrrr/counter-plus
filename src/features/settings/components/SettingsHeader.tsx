import { Pressable, Text, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { useTransitionBack } from '@/lib/transitionNav';

export function SettingsHeader() {
  const c = useThemeColors();
  const goBack = useTransitionBack();

  return (
    <View className="flex-row items-center justify-between px-2.5 pb-1.5">
      <Pressable
        testID="settings-back"
        accessibilityRole="button"
        accessibilityLabel="戻る"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
        <ChevronLeftIcon color={c.ink} />
      </Pressable>
      <Text accessibilityRole="header" className="font-sans-bold text-title text-ink">
        設定
      </Text>
      <View className="h-11 w-11" />
    </View>
  );
}
