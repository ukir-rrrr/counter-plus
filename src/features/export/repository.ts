import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { categories, counters } from '@/db/schema';

import type { CsvExportRow } from './csv';

/** 書き出し対象の項目。categoryId が無い／空なら0件 */
export async function listExportRows(categoryId: string | null | undefined): Promise<CsvExportRow[]> {
  if (categoryId === null) return [];

  const query = db
    .select({
      categoryName: categories.name,
      name: counters.name,
      count: counters.count,
      memo: counters.memo,
      updatedAt: counters.updatedAt,
    })
    .from(counters)
    .innerJoin(categories, eq(counters.categoryId, categories.id));

  if (categoryId === undefined) {
    return query.orderBy(asc(categories.sortOrder), asc(counters.sortOrder)).all();
  }
  return query.where(eq(counters.categoryId, categoryId)).orderBy(asc(counters.sortOrder)).all();
}
