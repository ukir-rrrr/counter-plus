import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';

export function SettingsLinkRow({
  testID,
  label,
  onPress,
  accent = false,
  showChevron = false,
  last = false,
}: {
  testID: string;
  label: string;
  onPress: () => void;
  accent?: boolean;
  showChevron?: boolean;
  last?: boolean;
}) {
  const c = useThemeColors();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`h-[52px] min-h-11 flex-row items-center justify-between px-3.5 active:opacity-70 ${
        last ? '' : 'border-b border-divider'
      }`}>
      <Text className={`font-sans text-body ${accent ? 'text-accent' : 'text-ink'}`}>{label}</Text>
      {showChevron ? (
        <View pointerEvents="none">
          <ChevronRightIcon color={c.inkSubtle} />
        </View>
      ) : null}
    </Pressable>
  );
}
