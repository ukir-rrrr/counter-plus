import { asc, count, eq, max, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { newId } from '@/db/id';
import { categories, countEvents, counters, type Category } from '@/db/schema';

const DEFAULT_CATEGORY_NAME = 'カテゴリ 1';

/** カテゴリが1つも無ければ「カテゴリ 1」を作る（初回起動時） */
export async function ensureDefaultCategory(): Promise<void> {
  db.transaction((tx) => {
    const row = tx.select({ total: count() }).from(categories).get();
    if (row && row.total > 0) return;

    const now = Date.now();
    tx.insert(categories)
      .values({
        id: newId(),
        name: DEFAULT_CATEGORY_NAME,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });
}

export async function listCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

/** カテゴリと項目数・合計を取得する */
export type CategoryWithStats = Category & { itemCount: number; total: number };

export async function listCategoriesWithStats(): Promise<CategoryWithStats[]> {
  const cats = await listCategories();
  const stats = db
    .select({
      categoryId: counters.categoryId,
      itemCount: count(counters.id),
      total: sql<number>`coalesce(sum(${counters.count}), 0)`,
    })
    .from(counters)
    .groupBy(counters.categoryId)
    .all();

  const statsMap = new Map(stats.map((s) => [s.categoryId, s]));

  return cats.map((cat) => {
    const s = statsMap.get(cat.id);
    return {
      ...cat,
      itemCount: s?.itemCount ?? 0,
      total: s?.total ?? 0,
    };
  });
}

/** カテゴリを新規作成する */
export function createCategory(name: string): Category {
  return db.transaction((tx) => {
    const now = Date.now();
    const last = tx.select({ value: max(categories.sortOrder) }).from(categories).get();
    const sortOrder = (last?.value ?? -1) + 1;

    const row: Category = {
      id: newId(),
      name,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    };
    tx.insert(categories).values(row).run();
    return row;
  });
}

/** カテゴリの名前を変更する */
export function renameCategory(id: string, name: string): void {
  db.update(categories)
    .set({ name, updatedAt: Date.now() })
    .where(eq(categories.id, id))
    .run();
}

/** カテゴリを削除する（中の項目と履歴も削除） */
export function deleteCategory(id: string): void {
  db.transaction((tx) => {
    // 履歴を先に消す（外部キー制約）
    const counterIds = tx
      .select({ id: counters.id })
      .from(counters)
      .where(eq(counters.categoryId, id))
      .all();
    for (const c of counterIds) {
      tx.delete(countEvents).where(eq(countEvents.counterId, c.id)).run();
    }
    // 項目を削除
    tx.delete(counters).where(eq(counters.categoryId, id)).run();
    // カテゴリを削除
    tx.delete(categories).where(eq(categories.id, id)).run();
  });
}

/** 並び順を保存する */
export function saveCategorySortOrder(ids: string[]): void {
  db.transaction((tx) => {
    const now = Date.now();
    ids.forEach((id, index) => {
      tx.update(categories)
        .set({ sortOrder: index, updatedAt: now })
        .where(eq(categories.id, id))
        .run();
    });
  });
}

export type SortType = 'manual' | 'name' | 'most' | 'least';

/** カテゴリ内の項目を自動並べ替えする */
export function autoSortCounters(categoryId: string, sortType: SortType): void {
  if (sortType === 'manual') return;

  db.transaction((tx) => {
    const rows = tx
      .select({ id: counters.id, name: counters.name, count: counters.count })
      .from(counters)
      .where(eq(counters.categoryId, categoryId))
      .all();

    let sorted: typeof rows;
    switch (sortType) {
      case 'name':
        sorted = rows.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
        break;
      case 'most':
        sorted = rows.sort((a, b) => b.count - a.count);
        break;
      case 'least':
        sorted = rows.sort((a, b) => a.count - b.count);
        break;
    }

    const now = Date.now();
    sorted.forEach((row, index) => {
      tx.update(counters)
        .set({ sortOrder: index, updatedAt: now })
        .where(eq(counters.id, row.id))
        .run();
    });
  });
}

/** 項目の並び順を保存する */
export function saveCounterSortOrder(ids: string[]): void {
  db.transaction((tx) => {
    const now = Date.now();
    ids.forEach((id, index) => {
      tx.update(counters)
        .set({ sortOrder: index, updatedAt: now })
        .where(eq(counters.id, id))
        .run();
    });
  });
}
