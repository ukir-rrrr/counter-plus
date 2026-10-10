import { Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';

export function AutoSaveNote() {
  const c = useThemeColors();
  return (
    <View className="flex-row items-center justify-center gap-1.5">
      <CheckIcon color={c.accent} size={14} />
      <Text className="font-sans text-label text-ink-muted">変更はその場で自動保存されます</Text>
    </View>
  );
}
