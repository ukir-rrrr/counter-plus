import { desc, eq } from 'drizzle-orm';

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
