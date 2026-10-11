import { Pressable, Text, View } from 'react-native';

/** 「完了」は閉じるだけ（変更はその場で自動保存済み） */
export function EditHeader({ onDone }: { onDone: () => void }) {
  return (
    <View className="-mt-1 flex-row items-center justify-between">
      <View className="w-16" />
      <Text accessibilityRole="header" className="font-sans-bold text-title text-ink">
        項目を編集
      </Text>
      <Pressable
        testID="done-button"
        accessibilityRole="button"
        accessibilityLabel="完了"
        onPress={onDone}
        className="h-11 w-16 items-end justify-center active:opacity-70">
        <Text className="font-sans-bold text-body text-accent">完了</Text>
      </Pressable>
    </View>
  );
}
