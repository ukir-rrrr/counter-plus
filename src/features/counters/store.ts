import { create } from 'zustand';

import { itemColors, type ItemColor } from '@/constants/theme';
import type { CountEventType, Counter } from '@/db/schema';

import { createCounter, listCounters, saveCount } from './repository';

type CountersState = {
  categoryId: string | null;
  /** 表示順の項目ID */
  ids: string[];
  byId: Record<string, Counter>;
  load: (categoryId: string) => Promise<void>;
  /** 変化があれば true（0で−を押したときは false） */
  increment: (id: string) => boolean;
  decrement: (id: string) => boolean;
  add: (name: string) => void;
};

const colorKeys = Object.keys(itemColors) as ItemColor[];

// 書き込みは1件ずつ順番に行う。setTimeout で数字の描画を先に済ませてから保存する
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(write: () => void, onError: () => void): void {
  writeQueue = writeQueue
    .then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
    .then(write)
    .catch((e: unknown) => {
      console.warn('カウントを保存できませんでした', e);
      onError();
    });
}

export const useCountersStore = create<CountersState>((set, get) => {
  function change(id: string, delta: 1 | -1, type: CountEventType): boolean {
    const counter = get().byId[id];
    if (!counter) return false;
    const countAfter = Math.max(0, counter.count + delta);
    if (countAfter === counter.count) return false;

    const at = Date.now();
    // ① 先に画面の値を更新して即描画
    set((s) => ({ byId: { ...s.byId, [id]: { ...counter, count: countAfter, updatedAt: at } } }));
    // ② そのあと SQLite に保存（count_events の追加も同じトランザクション）
    enqueueWrite(
      () => saveCount({ counterId: id, delta: countAfter - counter.count, countAfter, type, at }),
      () => {
        // 保存に失敗したら DB の値に合わせ直す
        const categoryId = get().categoryId;
        if (categoryId) get().load(categoryId);
      },
    );
    return true;
  }

  return {
    categoryId: null,
    ids: [],
    byId: {},
    load: async (categoryId) => {
      const rows = await listCounters(categoryId);
      set({
        categoryId,
        ids: rows.map((r) => r.id),
        byId: Object.fromEntries(rows.map((r) => [r.id, r])),
      });
    },
    increment: (id) => change(id, 1, 'increment'),
    decrement: (id) => change(id, -1, 'decrement'),
    add: (name) => {
      const { categoryId, ids } = get();
      if (!categoryId) return;
      const row = createCounter({ categoryId, name, color: colorKeys[ids.length % colorKeys.length] });
      set((s) => ({ ids: [...s.ids, row.id], byId: { ...s.byId, [row.id]: row } }));
    },
  };
});

export function selectTotal(s: CountersState): number {
  let total = 0;
  for (const id of s.ids) total += s.byId[id]?.count ?? 0;
  return total;
}
