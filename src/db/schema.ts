import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// IDはUUID（TEXT）、日時はUNIXミリ秒（INTEGER）。docs/architecture.md の「データ設計」を参照

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const counters = sqliteTable(
  'counters',
  {
    id: text('id').primaryKey(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    count: integer('count').notNull().default(0),
    memo: text('memo').notNull().default(''),
    color: text('color').notNull(),
    sortOrder: integer('sort_order').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('counters_category_sort_idx').on(t.categoryId, t.sortOrder),
    check('counters_count_non_negative', sql`${t.count} >= 0`),
  ],
);

export const countEventTypes = ['increment', 'decrement', 'edit', 'reset'] as const;

export const countEvents = sqliteTable(
  'count_events',
  {
    id: text('id').primaryKey(),
    counterId: text('counter_id')
      .notNull()
      .references(() => counters.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    countAfter: integer('count_after').notNull(),
    type: text('type', { enum: countEventTypes }).notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    index('count_events_counter_created_idx').on(t.counterId, t.createdAt),
    index('count_events_created_idx').on(t.createdAt),
  ],
);

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Counter = typeof counters.$inferSelect;
export type NewCounter = typeof counters.$inferInsert;
export type CountEvent = typeof countEvents.$inferSelect;
export type NewCountEvent = typeof countEvents.$inferInsert;
export type CountEventType = (typeof countEventTypes)[number];
