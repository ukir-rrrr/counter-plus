import { Pressable, Text, View } from 'react-native';

export function DangerActions({ onReset, onDelete }: { onReset: () => void; onDelete: () => void }) {
  return (
    <View className="flex-row gap-2">
      <Pressable
        accessibilityRole="button"
        onPress={onReset}
        className="h-12 flex-1 items-center justify-center rounded-control border border-border bg-surface active:opacity-70">
        <Text className="font-sans-medium text-body-sm text-ink">数を0にリセット</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onDelete}
        className="h-12 flex-1 items-center justify-center rounded-control border border-danger-border bg-danger-bg active:opacity-70">
        <Text className="font-sans-medium text-body-sm text-danger">この項目を削除</Text>
      </Pressable>
    </View>
  );
}
