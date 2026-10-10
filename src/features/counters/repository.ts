import { asc, eq, max } from 'drizzle-orm';

import { db } from '@/db/client';
import { newId } from '@/db/id';
import { counters, countEvents, type CountEventType, type Counter } from '@/db/schema';

// expo-sqlite 版の Drizzle はトランザクションが同期実行なので、中では .run() / .get() / .all() を使う（await しない）

export async function listCounters(categoryId: string): Promise<Counter[]> {
  return db.select().from(counters).where(eq(counters.categoryId, categoryId)).orderBy(asc(counters.sortOrder));
}

export function createCounter(input: { categoryId: string; name: string; color: string }): Counter {
  return db.transaction((tx) => {
    const last = tx
      .select({ value: max(counters.sortOrder) })
      .from(counters)
      .where(eq(counters.categoryId, input.categoryId))
      .get();
    const now = Date.now();
    const row: Counter = {
      id: newId(),
      categoryId: input.categoryId,
      name: input.name,
      count: 0,
      memo: '',
      color: input.color,
      sortOrder: (last?.value ?? -1) + 1,
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
        id: newId(),
        counterId: input.counterId,
        delta: input.delta,
        countAfter: input.countAfter,
        type: input.type,
        createdAt: input.at,
      })
      .run();
  });
}
