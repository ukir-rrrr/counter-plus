import { and, asc, eq, max } from 'drizzle-orm';

import { db } from '@/db/client';
import { newId } from '@/db/id';
import { counters, countEvents, type CountEventType, type Counter } from '@/db/schema';

// expo-sqlite 版の Drizzle はトランザクションが同期実行なので、中では .run() / .get() / .all() を使う（await しない）

export async function listCounters(categoryId: string): Promise<Counter[]> {
  return db.select().from(counters).where(eq(counters.categoryId, categoryId)).orderBy(asc(counters.sortOrder));
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** カテゴリの末尾に入れるときの sort_order */
function nextSortOrder(tx: Tx, categoryId: string): number {
  const last = tx
    .select({ value: max(counters.sortOrder) })
    .from(counters)
    .where(eq(counters.categoryId, categoryId))
    .get();
  return (last?.value ?? -1) + 1;
}

export function createCounter(input: { categoryId: string; name: string; color: string }): Counter {
  return db.transaction((tx) => {
    const now = Date.now();
    const row: Counter = {
      id: newId(),
      categoryId: input.categoryId,
      name: input.name,
      count: 0,
      memo: '',
      color: input.color,
      sortOrder: nextSortOrder(tx, input.categoryId),
      createdAt: now,
      updatedAt: now,
    };
    tx.insert(counters).values(row).run();
    return row;
  });
}

/** 数を保存し、同じトランザクションで履歴（count_events）を1行追加する */
export function saveCount(input: {
  counterId: string;
  eventId: string;
  delta: number;
  countAfter: number;
  type: CountEventType;
  at: number;
}): void {
  db.transaction((tx) => {
    tx.update(counters)
      .set({ count: input.countAfter, updatedAt: input.at })
      .where(eq(counters.id, input.counterId))
      .run();
    tx.insert(countEvents)
      .values({
        id: input.eventId,
        counterId: input.counterId,
        delta: input.delta,
        countAfter: input.countAfter,
        type: input.type,
        createdAt: input.at,
      })
      .run();
  });
}

/** リセットを取り消す。reset の履歴行を消し、数を元に戻す */
export function undoReset(input: { counterId: string; eventId: string; countBefore: number; at: number }): void {
  db.transaction((tx) => {
    tx.delete(countEvents)
      .where(and(eq(countEvents.id, input.eventId), eq(countEvents.counterId, input.counterId)))
      .run();
    tx.update(counters)
      .set({ count: input.countBefore, updatedAt: input.at })
      .where(eq(counters.id, input.counterId))
      .run();
  });
}

export type CounterPatch = Partial<Pick<Counter, 'name' | 'memo' | 'color'>>;

export function updateCounter(id: string, patch: CounterPatch, at: number): void {
  db.update(counters)
    .set({ ...patch, updatedAt: at })
    .where(eq(counters.id, id))
    .run();
}

/** 別のカテゴリの末尾へ移す */
export function moveCounter(id: string, categoryId: string, at: number): void {
  db.transaction((tx) => {
    tx.update(counters)
      .set({ categoryId, sortOrder: nextSortOrder(tx, categoryId), updatedAt: at })
      .where(eq(counters.id, id))
      .run();
  });
}

/** 項目と、その履歴をまとめて削除する */
export function deleteCounter(id: string): void {
  db.transaction((tx) => {
    tx.delete(countEvents).where(eq(countEvents.counterId, id)).run();
    tx.delete(counters).where(eq(counters.id, id)).run();
  });
}
