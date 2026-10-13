import { count, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { categories, countEvents, counters, type CountEventType } from '@/db/schema';

export type HistoryEventRow = {
  id: string;
  counterId: string;
  counterName: string;
  categoryId: string;
  categoryName: string;
  delta: number;
  countAfter: number;
  type: CountEventType;
  createdAt: number;
};

/** 件数が不正なときは 0 にする */
export function normalizeHistoryCount(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

/** 購入画面の「これまでの履歴 N件」用。失敗しても 0 */
export function countHistoryEvents(): number {
  try {
    const row = db.select({ total: count() }).from(countEvents).get();
    return normalizeHistoryCount(row?.total);
  } catch {
    return 0;
  }
}

/** count_events を項目・カテゴリと結合し、新しい順に返す */
export async function listHistoryEvents(): Promise<HistoryEventRow[]> {
  return db
    .select({
      id: countEvents.id,
      counterId: countEvents.counterId,
      counterName: counters.name,
      categoryId: counters.categoryId,
      categoryName: categories.name,
      delta: countEvents.delta,
      countAfter: countEvents.countAfter,
      type: countEvents.type,
      createdAt: countEvents.createdAt,
    })
    .from(countEvents)
    .innerJoin(counters, eq(countEvents.counterId, counters.id))
    .innerJoin(categories, eq(counters.categoryId, categories.id))
    .orderBy(desc(countEvents.createdAt))
    .all();
}
