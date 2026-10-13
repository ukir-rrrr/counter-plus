import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-2">
      <Text className="px-8 pb-1 font-sans-medium text-label text-ink-muted">{title}</Text>
      <View className="mx-screen overflow-hidden rounded-card border border-border bg-surface">{children}</View>
    </View>
  );
}
