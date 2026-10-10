import { create } from 'zustand';

import { itemColors, type ItemColor } from '@/constants/theme';
import { newId } from '@/db/id';
import type { CountEventType, Counter } from '@/db/schema';

import {
  createCounter,
  deleteCounter,
  listCounters,
  moveCounter,
  saveCount,
  undoReset,
  updateCounter,
  type CounterPatch,
} from './repository';

/** 直接入力できる数の上限 */
export const MAX_COUNT = 999_999_999;

/** リセットを取り消せる時間（ミリ秒） */
const UNDO_DURATION = 5000;

type PendingUndo = { counterId: string; eventId: string; countBefore: number };

type CountersState = {
  categoryId: string | null;
  /** 表示順の項目ID */
  ids: string[];
  byId: Record<string, Counter>;
  /** 直前のリセット。取り消せるあいだだけ入っている */
  pendingUndo: PendingUndo | null;
  load: (categoryId: string) => Promise<void>;
  /** 以下の数を変える操作は、変化があれば true を返す（0で−を押したときなどは false） */
  increment: (id: string) => boolean;
  decrement: (id: string) => boolean;
  /** ±5・±10 など */
  step: (id: string, delta: number) => boolean;
  /** 数値の直接入力 */
  setCount: (id: string, value: number) => boolean;
  reset: (id: string) => boolean;
  undoReset: () => void;
  add: (name: string) => void;
  /** 名前・メモ・色 */
  update: (id: string, patch: CounterPatch) => void;
  move: (id: string, categoryId: string) => void;
  remove: (id: string) => void;
};

const colorKeys = Object.keys(itemColors) as ItemColor[];

// 書き込みは1件ずつ順番に行う。setTimeout で数字の描画を先に済ませてから保存する
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite(write: () => void, onError: () => void): void {
  writeQueue = writeQueue
    .then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
    .then(write)
    .catch((e: unknown) => {
      console.warn('保存できませんでした', e);
      onError();
    });
}

let undoTimer: ReturnType<typeof setTimeout> | undefined;

export const useCountersStore = create<CountersState>((set, get) => {
  // 保存に失敗したら DB の値に合わせ直す
  function reload(): void {
    const categoryId = get().categoryId;
    if (categoryId) get().load(categoryId);
  }

  function clearUndo(): void {
    clearTimeout(undoTimer);
    if (get().pendingUndo) set({ pendingUndo: null });
  }

  function applyCount(id: string, value: number, type: CountEventType): string | null {
    const counter = get().byId[id];
    if (!counter) return null;
    const countAfter = Math.min(MAX_COUNT, Math.max(0, Math.trunc(value)));
    if (countAfter === counter.count) return null;

    // リセットのあとに数が変わったら、もう取り消せない
    if (get().pendingUndo?.counterId === id) clearUndo();

    const at = Date.now();
    const eventId = newId();
    // ① 先に画面の値を更新して即描画
    set((s) => ({ byId: { ...s.byId, [id]: { ...counter, count: countAfter, updatedAt: at } } }));
    // ② そのあと SQLite に保存（count_events の追加も同じトランザクション）
    enqueueWrite(
      () => saveCount({ counterId: id, eventId, delta: countAfter - counter.count, countAfter, type, at }),
      reload,
    );
    return eventId;
  }

  function step(id: string, delta: number): boolean {
    const counter = get().byId[id];
    if (!counter || delta === 0) return false;
    return applyCount(id, counter.count + delta, delta > 0 ? 'increment' : 'decrement') !== null;
  }

  return {
    categoryId: null,
    ids: [],
    byId: {},
    pendingUndo: null,
    load: async (categoryId) => {
      const rows = await listCounters(categoryId);
      set({
        categoryId,
        ids: rows.map((r) => r.id),
        byId: Object.fromEntries(rows.map((r) => [r.id, r])),
      });
    },
    increment: (id) => step(id, 1),
    decrement: (id) => step(id, -1),
    step,
    setCount: (id, value) => applyCount(id, value, 'edit') !== null,
    reset: (id) => {
      const countBefore = get().byId[id]?.count ?? 0;
      const eventId = applyCount(id, 0, 'reset');
      if (!eventId) return false;
      clearTimeout(undoTimer);
      set({ pendingUndo: { counterId: id, eventId, countBefore } });
      undoTimer = setTimeout(() => set({ pendingUndo: null }), UNDO_DURATION);
      return true;
    },
    undoReset: () => {
      const pending = get().pendingUndo;
      clearUndo();
      if (!pending) return;
      const counter = get().byId[pending.counterId];
      if (!counter) return;
      const at = Date.now();
      set((s) => ({ byId: { ...s.byId, [counter.id]: { ...counter, count: pending.countBefore, updatedAt: at } } }));
      enqueueWrite(() => undoReset({ ...pending, at }), reload);
    },
    add: (name) => {
      const { categoryId, ids } = get();
      if (!categoryId) return;
      const row = createCounter({ categoryId, name, color: colorKeys[ids.length % colorKeys.length] });
      set((s) => ({ ids: [...s.ids, row.id], byId: { ...s.byId, [row.id]: row } }));
    },
    update: (id, patch) => {
      const counter = get().byId[id];
      if (!counter) return;
      const at = Date.now();
      set((s) => ({ byId: { ...s.byId, [id]: { ...counter, ...patch, updatedAt: at } } }));
      enqueueWrite(() => updateCounter(id, patch, at), reload);
    },
    move: (id, categoryId) => {
      const counter = get().byId[id];
      if (!counter || counter.categoryId === categoryId) return;
      const at = Date.now();
      set((s) => ({
        // 表示中のカテゴリから外れたらリストからも外す（byId には残し、開いている編集シートで使う）
        ids: categoryId === s.categoryId ? s.ids : s.ids.filter((x) => x !== id),
        byId: { ...s.byId, [id]: { ...counter, categoryId, updatedAt: at } },
      }));
      enqueueWrite(() => moveCounter(id, categoryId, at), reload);
    },
    remove: (id) => {
      if (get().pendingUndo?.counterId === id) clearUndo();
      set((s) => {
        const { [id]: _removed, ...byId } = s.byId;
        return { ids: s.ids.filter((x) => x !== id), byId };
      });
      enqueueWrite(() => deleteCounter(id), reload);
    },
  };
});

export function selectTotal(s: CountersState): number {
  let total = 0;
  for (const id of s.ids) total += s.byId[id]?.count ?? 0;
  return total;
}
