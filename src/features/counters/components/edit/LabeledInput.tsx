import { Text, View } from 'react-native';

import { useThemeColors } from '@/constants/use-theme-colors';

import { SheetTextInput } from './SheetTextInput';

export function LabeledInput({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  testID?: string;
}) {
  const c = useThemeColors();
  return (
    <View className="gap-1.5">
      <Text className="font-sans-medium text-label text-ink-muted">{label}</Text>
      <SheetTextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={c.inkSubtle}
        returnKeyType="done"
        className="h-12 rounded-control border border-border bg-surface px-3.5 font-sans text-body text-ink"
      />
    </View>
  );
}
