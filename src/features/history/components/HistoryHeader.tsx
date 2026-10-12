import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChevronLeftIcon, DownloadIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';

export function HistoryHeader({ onExport }: { onExport: () => void }) {
  const c = useThemeColors();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View className="flex-row items-center justify-between px-2.5 pb-1.5">
      <Pressable
        testID="history-back"
        accessibilityRole="button"
        accessibilityLabel="戻る"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
        <ChevronLeftIcon color={c.ink} />
      </Pressable>
      <Text accessibilityRole="header" className="font-sans-bold text-title text-ink">
        履歴
      </Text>
      <Pressable
        testID="history-export"
        accessibilityRole="button"
        accessibilityLabel="履歴をCSVで書き出す"
        onPress={onExport}
        className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
        <DownloadIcon color={c.ink} />
      </Pressable>
    </View>
  );
}
