import { Text, View } from 'react-native';

export function ProBadge() {
  return (
    <View className="rounded bg-accent px-[5px] py-px">
      <Text className="font-sans-bold text-hint tracking-wide text-on-accent">PRO</Text>
    </View>
  );
}
