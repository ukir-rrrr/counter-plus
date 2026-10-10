import { Text, View } from 'react-native';

// バナー広告の仮枠。ステップ8で src/lib/ads.tsx の本物のバナーに置き換える（Proなら非表示）
export function AdPlaceholder() {
  return (
    <View className="h-[60px] flex-row items-center justify-center gap-2 border-t border-border bg-ad-bg">
      <View className="rounded-sm border border-ink-subtle px-[5px] py-px">
        <Text className="font-sans text-hint text-ink-muted">広告</Text>
      </View>
      <Text className="font-sans text-label text-ink-muted">バナー広告</Text>
    </View>
  );
}
