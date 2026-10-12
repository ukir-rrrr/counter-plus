import { Pressable, ScrollView, Text } from 'react-native';

import type { CategoryWithStats } from '@/features/categories/store';

export function FilterChips({
  categories,
  selectedId,
  onSelect,
}: {
  categories: CategoryWithStats[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <ScrollView
      testID="history-filters"
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-screen pb-3 pt-1"
      className="grow-0">
      <Chip
        testID="history-filter-all"
        label="すべて"
        selected={selectedId == null}
        onPress={() => onSelect(null)}
      />
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          testID={`history-filter-${cat.id}`}
          label={cat.name}
          selected={selectedId === cat.id}
          onPress={() => onSelect(cat.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  testID,
  label,
  selected,
  onPress,
}: {
  testID: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-11 min-w-[44px] items-center justify-center rounded-full border px-3.5 active:opacity-70 ${
        selected ? 'border-ink bg-ink' : 'border-border bg-surface'
      }`}>
      <Text className={`font-sans-medium text-body-sm ${selected ? 'text-background' : 'text-ink'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
