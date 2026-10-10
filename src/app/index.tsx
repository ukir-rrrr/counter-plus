import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { listCategories } from '@/features/categories/repository';

// 仮のホーム画面。ステップ2でリストとカウントに置き換える
export default function Home() {
  const [categoryName, setCategoryName] = useState<string>();

  useEffect(() => {
    listCategories().then((rows) => setCategoryName(rows[0]?.name));
  }, []);

  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background px-screen">
      <Text className="font-sans-bold text-title text-ink">カウンター＋</Text>
      <Text className="font-sans text-body text-ink-muted">{categoryName ?? ''}</Text>
      <Text className="font-mono-semibold text-total text-accent">0</Text>
    </View>
  );
}
