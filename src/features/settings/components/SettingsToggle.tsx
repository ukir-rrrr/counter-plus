import { Pressable, Switch, Text, View } from 'react-native';

import { useThemeColors } from '@/constants/use-theme-colors';

export function SettingsToggle({
  testID,
  label,
  description,
  value,
  onValueChange,
  last = false,
}: {
  testID: string;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  last?: boolean;
}) {
  const c = useThemeColors();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      className={`min-h-14 flex-row items-center gap-3 px-3.5 active:opacity-70 ${
        last ? '' : 'border-b border-divider'
      }`}>
      <View className="min-w-0 flex-1 gap-px">
        <Text className="font-sans text-body text-ink">{label}</Text>
        <Text className="font-sans text-hint text-ink-subtle">{description}</Text>
      </View>
      {/* サイズや transform は付けない。潰さないよう intrinsic のまま置く */}
      <View pointerEvents="none" className="shrink-0 justify-center">
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: c.border, true: c.accent }}
          thumbColor={c.surface}
          ios_backgroundColor={c.border}
        />
      </View>
    </Pressable>
  );
}
