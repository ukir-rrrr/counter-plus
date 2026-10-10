import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import type { Category } from '@/db/schema';
import { listCategories } from '@/features/categories/repository';

/** タップすると下に移動先の一覧が開く */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (categoryId: string) => void }) {
  const c = useThemeColors();
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories);
  }, []);

  const current = categories.find((x) => x.id === value);

  return (
    <View className="overflow-hidden rounded-control border border-border bg-surface">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`カテゴリ：${current?.name ?? ''}`}
        accessibilityHint="タップで移動先を選ぶ"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="h-12 flex-row items-center justify-between px-3.5 active:opacity-70">
        <Text className="font-sans-medium text-label text-ink-muted">カテゴリ</Text>
        <View className="flex-row items-center gap-1">
          <Text className="font-sans text-body text-ink">{current?.name ?? ''}</Text>
          {open ? <ChevronDownIcon color={c.inkSubtle} /> : <ChevronRightIcon color={c.inkSubtle} />}
        </View>
      </Pressable>
      {open &&
        categories.map((category) => {
          const selected = category.id === value;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                onChange(category.id);
                setOpen(false);
              }}
              className="min-h-11 flex-row items-center justify-between border-t border-divider px-3.5 active:opacity-70">
              <Text className="font-sans text-body-sm text-ink">{category.name}</Text>
              {selected && <CheckIcon color={c.accent} size={16} />}
            </Pressable>
          );
        })}
    </View>
  );
}
