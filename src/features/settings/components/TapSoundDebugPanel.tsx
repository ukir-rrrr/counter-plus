import { Pressable, Text, View } from 'react-native';

import { tapSound, useTapSoundDebug } from '@/lib/sound';

/** 実機で Metro ログが届かないとき用。__DEV__ の設定画面にだけ出す */
export function TapSoundDebugPanel() {
  const events = useTapSoundDebug();

  return (
    <Pressable
      testID="settings-sound-debug"
      accessibilityRole="button"
      accessibilityLabel="タップ音デバッグ。押すと再生を試す"
      onPress={() => {
        tapSound();
      }}
      className="mx-screen mb-2 rounded-card border border-border bg-surface px-3.5 py-3">
      <Text className="font-sans-medium text-label text-ink-muted">タップ音デバッグ（開発）</Text>
      <Text className="mb-1 font-sans text-hint text-ink-subtle">ここを押すと再生。直近5件</Text>
      {events.length === 0 ? (
        <Text className="font-mono text-hint text-ink">まだタップなし</Text>
      ) : (
        <View className="gap-0.5">
          {events.map((event) => (
            <Text key={event.seq} className="font-mono text-hint text-ink">
              {`#${event.seq} slot=${event.slot} loaded=${String(event.isLoaded)} playing=${String(event.playing)} ${event.extra}`}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}
