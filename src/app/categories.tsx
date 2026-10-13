import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon, PlusIcon } from '@/components/icons';
import { useThemeColors } from '@/constants/use-theme-colors';
import { CategoryNameDialog } from '@/features/categories/components/CategoryNameDialog';
import { CategoryRow } from '@/features/categories/components/CategoryRow';
import { defaultCategoryName, resolveCategoryName } from '@/features/categories/name';
import {
  selectGrandTotal,
  selectTotalCategories,
  useCategoriesStore,
  type CategoryWithStats,
} from '@/features/categories/store';
import { useCountersStore } from '@/features/counters/store';
import { tapHaptic } from '@/lib/haptics';

function Header({ isEditing, onToggleEdit }: { isEditing: boolean; onToggleEdit: () => void }) {
  const c = useThemeColors();

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View className="flex-row items-center justify-between px-2.5 pb-1.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="閉じる"
        onPress={handleClose}
        className="h-11 w-11 items-center justify-center rounded-control active:opacity-70">
        <CloseIcon color={c.ink} />
      </Pressable>
      <Text className="font-sans-bold text-title text-ink">カテゴリ</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isEditing ? '完了' : '編集'}
        onPress={onToggleEdit}
        className="h-11 w-14 items-center justify-center rounded-control active:opacity-70">
        <Text className="font-sans-medium text-body text-accent">{isEditing ? '完了' : '編集'}</Text>
      </Pressable>
    </View>
  );
}

function GrandTotalCard() {
  const grandTotal = useCategoriesStore(selectGrandTotal);
  const categoryCount = useCategoriesStore(selectTotalCategories);

  return (
    <View className="mx-screen mb-3.5 mt-1 rounded-card border border-border bg-surface px-4 py-3.5">
      <View className="flex-row items-end justify-between">
        <View className="gap-0.5">
          <Text className="font-sans text-label text-ink-muted">すべてのカテゴリの合計</Text>
          <Text className="font-mono-semibold text-total leading-tight text-ink">
            {grandTotal.toLocaleString()}
          </Text>
        </View>
        <Text className="font-sans text-label text-ink-muted">{categoryCount} カテゴリ</Text>
      </View>
    </View>
  );
}

function DraggableCategoryRow({
  item,
  drag,
  isActive,
  getIndex,
  isSelected,
  isEditing,
  onSelect,
  onRename,
  onDelete,
}: RenderItemParams<CategoryWithStats> & {
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <ScaleDecorator>
      <CategoryRow
        item={item}
        index={getIndex() ?? 0}
        isSelected={isSelected}
        isEditing={isEditing}
        isActive={isActive}
        onDrag={drag}
        onSelect={onSelect}
        onRename={onRename}
        onDelete={onDelete}
      />
    </ScaleDecorator>
  );
}

function AddCategoryButton({ onAdd }: { onAdd: () => void }) {
  const c = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="カテゴリを追加"
      onPress={onAdd}
      className="h-14 flex-row items-center justify-center gap-1.5 active:opacity-70">
      <PlusIcon color={c.accent} size={18} strokeWidth={2} />
      <Text className="font-sans-medium text-body-sm text-accent">カテゴリを追加</Text>
    </Pressable>
  );
}

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CategoryWithStats | null>(null);
  const [adding, setAdding] = useState(false);

  const categories = useCategoriesStore((s) => s.categories);
  const selectedId = useCategoriesStore((s) => s.selectedId);
  const load = useCategoriesStore((s) => s.load);
  const select = useCategoriesStore((s) => s.select);
  const add = useCategoriesStore((s) => s.add);
  const rename = useCategoriesStore((s) => s.rename);
  const remove = useCategoriesStore((s) => s.remove);
  const reorder = useCategoriesStore((s) => s.reorder);

  const countersLoad = useCountersStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = useCallback(
    (id: string) => {
      select(id);
      countersLoad(id);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    },
    [select, countersLoad]
  );

  const addFallbackName = defaultCategoryName(categories.length);

  const handleAdd = () => {
    setAdding(true);
  };

  const handleAddSubmit = (input: string) => {
    const name = resolveCategoryName(input, addFallbackName);
    const newCat = add(name);
    if (newCat) tapHaptic();
    setAdding(false);
  };

  const handleRename = useCallback((category: CategoryWithStats) => {
    setRenameTarget(category);
  }, []);

  const handleRenameSubmit = (name: string) => {
    if (renameTarget) {
      rename(renameTarget.id, name);
      tapHaptic();
    }
    setRenameTarget(null);
  };

  const handleDelete = useCallback(
    (category: CategoryWithStats) => {
      const currentCategories = useCategoriesStore.getState().categories;
      if (currentCategories.length <= 1) {
        Alert.alert('削除できません', '最後のカテゴリは削除できません。');
        return;
      }

      const itemInfo =
        category.itemCount > 0
          ? `「${category.name}」には ${category.itemCount} 個の項目があります。項目と履歴も削除されます。`
          : `「${category.name}」を削除します。`;

      Alert.alert('カテゴリを削除しますか？', `${itemInfo}元に戻せません。`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            remove(category.id);
            tapHaptic();
          },
        },
      ]);
    },
    [remove]
  );

  const handleDragEnd = ({ data }: { data: CategoryWithStats[] }) => {
    reorder(data.map((cat) => cat.id));
    tapHaptic();
  };

  const renderItem = useCallback(
    (params: RenderItemParams<CategoryWithStats>) => (
      <DraggableCategoryRow
        {...params}
        isSelected={params.item.id === selectedId}
        isEditing={isEditing}
        onSelect={() => handleSelect(params.item.id)}
        onRename={() => handleRename(params.item)}
        onDelete={() => handleDelete(params.item)}
      />
    ),
    [selectedId, isEditing, handleSelect, handleRename, handleDelete]
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header isEditing={isEditing} onToggleEdit={() => setIsEditing((v) => !v)} />
      <GrandTotalCard />

      <View className="mx-screen flex-1 overflow-hidden rounded-card border border-border bg-surface">
        <DraggableFlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          ListFooterComponent={<AddCategoryButton onAdd={handleAdd} />}
        />
      </View>

      <Text className="px-screen py-3 text-center font-sans text-hint text-ink-subtle">
        長押しで名前の変更・削除、左のつまみで並べ替え
      </Text>

      <View style={{ height: insets.bottom }} />

      <CategoryNameDialog
        visible={adding}
        title="カテゴリを追加"
        initialName=""
        placeholder={addFallbackName}
        submitLabel="追加"
        allowEmpty
        onSubmit={handleAddSubmit}
        onCancel={() => setAdding(false)}
      />
      <CategoryNameDialog
        visible={renameTarget !== null}
        title="カテゴリ名を変更"
        initialName={renameTarget?.name ?? ''}
        submitLabel="変更"
        onSubmit={handleRenameSubmit}
        onCancel={() => setRenameTarget(null)}
      />
    </View>
  );
}
