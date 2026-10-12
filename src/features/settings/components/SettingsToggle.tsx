import { Pressable, Text, View } from 'react-native';

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
      <View className="flex-1 gap-px">
        <Text className="font-sans text-body text-ink">{label}</Text>
        <Text className="font-sans text-hint text-ink-subtle">{description}</Text>
      </View>
      <View
        pointerEvents="none"
        className={`h-8 w-[52px] flex-row rounded-full p-[3px] ${
          value ? 'justify-end bg-accent' : 'justify-start bg-border'
        }`}>
        <View className="h-[26px] w-[26px] rounded-full bg-surface" />
      </View>
    </Pressable>
  );
}
