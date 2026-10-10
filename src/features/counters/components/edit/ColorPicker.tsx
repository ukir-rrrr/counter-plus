import { Pressable, Text, View } from 'react-native';

import { itemColors, type ItemColor } from '@/constants/theme';

const colorLabels: Record<ItemColor, string> = {
  blue: '青',
  green: '緑',
  orange: 'オレンジ',
  purple: '紫',
  red: '赤',
  gray: 'グレー',
};

const colorKeys = Object.keys(itemColors) as ItemColor[];

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: ItemColor) => void }) {
  return (
    <View className="gap-2">
      <Text className="font-sans-medium text-label text-ink-muted">色</Text>
      <View className="flex-row gap-0.5">
        {colorKeys.map((key) => {
          const selected = key === value;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityLabel={`色：${colorLabels[key]}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(key)}
              // 選択中は「地の色の隙間＋濃い輪」の2重リング
              className={`h-[46px] w-[46px] items-center justify-center rounded-full border-2 ${
                selected ? 'border-ink' : 'border-transparent'
              }`}>
              <View className="h-9 w-9 rounded-full" style={{ backgroundColor: itemColors[key] }} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
