import { asc, count } from 'drizzle-orm';

import { db } from '@/db/client';
import { newId } from '@/db/id';
import { categories, type Category } from '@/db/schema';

const DEFAULT_CATEGORY_NAME = 'カテゴリ 1';

/** カテゴリが1つも無ければ「カテゴリ 1」を作る（初回起動時） */
export async function ensureDefaultCategory(): Promise<void> {
  await db.transaction(async (tx) => {
    const [{ total }] = await tx.select({ total: count() }).from(categories);
    if (total > 0) return;

    const now = Date.now();
    await tx.insert(categories).values({
      id: newId(),
      name: DEFAULT_CATEGORY_NAME,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  });
}

export async function listCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}
