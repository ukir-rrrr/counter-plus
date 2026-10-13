import { Pressable, Text, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { useTransitionBack } from '@/lib/transitionNav';

export function SettingsHeader({
  title = '設定',
  backTestID = 'settings-back',
}: {
  title?: string;
  backTestID?: string;
}) {
  const c = useThemeColors();
  const goBack = useTransitionBack();

  return (
    <View className="flex-row items-center justify-between px-2.5 pb-1.5">
      <Pressable
        testID={backTestID}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
        <ChevronLeftIcon color={c.ink} />
      </Pressable>
      <Text accessibilityRole="header" className="font-sans-bold text-title text-ink">
        {title}
      </Text>
      <View className="h-11 w-11" />
    </View>
  );
}
