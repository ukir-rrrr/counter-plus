import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { tapHaptic } from '@/lib/haptics';

import { MAX_COUNT, useCountersStore } from '../../store';
import { SheetTextInput } from './SheetTextInput';

const steps = [-10, -5, 5, 10] as const;

function stepLabel(n: number): string {
  return (n > 0 ? '+' : '−') + Math.abs(n);
}

export function CountAdjuster({ id }: { id: string }) {
  const c = useThemeColors();
  const count = useCountersStore((s) => s.byId[id]?.count ?? 0);
  const step = useCountersStore((s) => s.step);
  const setCount = useCountersStore((s) => s.setCount);
  // 直接入力中の文字列（入力中でなければ null）
  const [draft, setDraft] = useState<string | null>(null);

  const apply = (delta: number) => {
    if (step(id, delta)) tapHaptic();
  };

  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    // 空のまま確定したら何もしない
    if (draft.trim() === '') return;
    const value = Number(draft);
    if (Number.isFinite(value) && setCount(id, value)) tapHaptic();
  };

  return (
    <View className="gap-3 rounded-card bg-background p-3.5">
      <View className="flex-row items-center justify-between gap-3">
        <Pressable
          testID="decrement-button"
          accessibilityRole="button"
          accessibilityLabel="1減らす"
          onPress={() => apply(-1)}
          className="h-14 w-14 items-center justify-center rounded-control bg-surface active:opacity-70">
          <MinusIcon color={c.ink} size={22} />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="font-sans text-hint text-ink-muted">現在の数（タップで直接入力）</Text>
          {draft === null ? (
            <Pressable
              testID="count-display"
              accessibilityRole="button"
              accessibilityLabel={`現在の数 ${count}`}
              accessibilityHint="タップで数を直接入力"
              onPress={() => setDraft(String(count))}
              className="min-h-11 self-stretch items-center">
              <Text
                className="font-mono-semibold text-count-lg leading-[50px] text-ink"
                style={{ fontVariant: ['tabular-nums'] }}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {count}
              </Text>
            </Pressable>
          ) : (
            <SheetTextInput
              testID="count-input"
              accessibilityLabel="数を入力"
              value={draft}
              onChangeText={(text: string) => setDraft(text.replace(/[^0-9]/g, ''))}
              onSubmitEditing={commit}
              onBlur={commit}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={String(MAX_COUNT).length}
              autoFocus
              selectTextOnFocus
              className="h-[50px] self-stretch rounded-control border border-accent bg-surface p-0 text-center font-mono-semibold text-count-lg text-ink"
              style={{ fontVariant: ['tabular-nums'] }}
            />
          )}
        </View>
        <Pressable
          testID="increment-button"
          accessibilityRole="button"
          accessibilityLabel="1増やす"
          onPress={() => apply(1)}
          className="h-14 w-14 items-center justify-center rounded-control bg-accent active:opacity-80">
          <PlusIcon color={c.onAccent} size={22} />
        </Pressable>
      </View>
      <View className="flex-row gap-2">
        {steps.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={n > 0 ? `${n}増やす` : `${-n}減らす`}
            onPress={() => apply(n)}
            className="h-11 flex-1 items-center justify-center rounded-control border border-border bg-surface active:opacity-70">
            <Text className="font-mono-medium text-body text-ink">{stepLabel(n)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
