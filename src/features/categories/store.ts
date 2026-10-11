import { create } from 'zustand';

import {
  createCategory,
  deleteCategory,
  listCategoriesWithStats,
  renameCategory,
  saveCategorySortOrder,
  type CategoryWithStats,
  type SortType,
  autoSortCounters,
} from './repository';

export type { CategoryWithStats } from './repository';

type CategoriesState = {
  categories: CategoryWithStats[];
  selectedId: string | null;
  isLoading: boolean;
  load: () => Promise<void>;
  select: (id: string) => void;
  add: (name: string) => CategoryWithStats | null;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  reorder: (ids: string[]) => void;
  autoSort: (sortType: SortType) => void;
};

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(write: () => void, onError?: () => void): void {
  writeQueue = writeQueue
    .then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
    .then(write)
    .catch((e: unknown) => {
      console.warn('カテゴリの保存に失敗', e);
      onError?.();
    });
}

export const useCategoriesStore = create<CategoriesState>((set, get) => {
  function reload(): void {
    get().load();
  }

  return {
    categories: [],
    selectedId: null,
    isLoading: true,

    load: async () => {
      set({ isLoading: true });
      const categories = await listCategoriesWithStats();
      const currentSelectedId = get().selectedId;
      // 選択中のカテゴリが存在するか確認し、なければ先頭を選択
      const selectedId =
        categories.find((c) => c.id === currentSelectedId)?.id ?? categories[0]?.id ?? null;
      set({ categories, selectedId, isLoading: false });
    },

    select: (id) => {
      set({ selectedId: id });
    },

    add: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      try {
        const newCat = createCategory(trimmed);
        const categories = get().categories;
        const catWithStats: CategoryWithStats = { ...newCat, itemCount: 0, total: 0 };
        set({ categories: [...categories, catWithStats] });
        return catWithStats;
      } catch (e) {
        console.warn('カテゴリの作成に失敗', e);
        return null;
      }
    },

    rename: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      set((s) => ({
        categories: s.categories.map((c) =>
          c.id === id ? { ...c, name: trimmed, updatedAt: Date.now() } : c
        ),
      }));
      enqueueWrite(() => renameCategory(id, trimmed), reload);
    },

    remove: (id) => {
      const { categories, selectedId } = get();
      const filtered = categories.filter((c) => c.id !== id);
      // 削除したカテゴリが選択されていたら、先頭を選択
      const newSelectedId = selectedId === id ? (filtered[0]?.id ?? null) : selectedId;
      set({ categories: filtered, selectedId: newSelectedId });
      enqueueWrite(() => deleteCategory(id), reload);
    },

    reorder: (ids) => {
      const { categories } = get();
      const sorted = ids
        .map((id) => categories.find((c) => c.id === id))
        .filter((c): c is CategoryWithStats => c != null);
      set({ categories: sorted });
      enqueueWrite(() => saveCategorySortOrder(ids), reload);
    },

    autoSort: (sortType) => {
      const { selectedId } = get();
      if (!selectedId || sortType === 'manual') return;
      enqueueWrite(() => autoSortCounters(selectedId, sortType), reload);
    },
  };
});

export function selectGrandTotal(s: CategoriesState): number {
  return s.categories.reduce((acc, c) => acc + c.total, 0);
}

export function selectTotalCategories(s: CategoriesState): number {
  return s.categories.length;
}
