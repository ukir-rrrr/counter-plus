import { Alert, Pressable, Text } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';

import { useCountersStore } from '../store';

export function AddCounterButton() {
  const c = useThemeColors();
  const add = useCountersStore((s) => s.add);

  const onPress = () => {
    // 名前の入力ダイアログ（iOSのみ）。ステップ3で編集シートを開く形に変えてもよい
    Alert.prompt('項目を追加', '項目の名前を入力してください', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '追加',
        onPress: (value?: string) => {
          const name = value?.trim();
          if (name) add(name);
        },
      },
    ]);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-[52px] flex-row items-center justify-center gap-1.5 active:opacity-70">
      <PlusIcon color={c.accent} size={18} strokeWidth={2} />
      <Text className="font-sans-medium text-body-sm text-accent">項目を追加</Text>
    </Pressable>
  );
}
