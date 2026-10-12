import type { CountEventType } from '@/db/schema';

import type { HistoryEventRow } from './repository';

/** 履歴バッジ。＋は緑、−はグレー、編集とリセットはオレンジ */
export type HistoryBadgeKind = CountEventType;

export type HistoryBadge = {
  kind: HistoryBadgeKind;
  label: string;
};

export type HistoryListItem =
  | { kind: 'heading'; key: string; label: string }
  | {
      kind: 'event';
      key: string;
      event: HistoryEventRow;
      time: string;
      badge: HistoryBadge;
    };

const MINUS = '−';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** 端末のローカルタイムゾーンで、その日の 0:00:00.000 */
export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatLocalTime(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatMonthDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 今日 / 昨日 / 日付。年をまたぐときだけ西暦を付ける */
export function formatDateHeading(ms: number, now: number): string {
  const day = startOfLocalDay(ms);
  const today = startOfLocalDay(now);
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.getTime();
  const monthDay = formatMonthDay(ms);
  if (day === today) return `今日 ${monthDay}`;
  if (day === yesterday) return `昨日 ${monthDay}`;
  if (new Date(ms).getFullYear() !== new Date(now).getFullYear()) {
    return `${new Date(ms).getFullYear()}年${monthDay}`;
  }
  return monthDay;
}

export function badgeForEvent(type: CountEventType, delta: number): HistoryBadge {
  switch (type) {
    case 'increment':
      return { kind: 'increment', label: `+${Math.abs(delta)}` };
    case 'decrement':
      return { kind: 'decrement', label: `${MINUS}${Math.abs(delta)}` };
    case 'edit':
      return { kind: 'edit', label: '編集' };
    case 'reset':
      return { kind: 'reset', label: '0に' };
  }
}

export function filterEventsByCategory(
  events: HistoryEventRow[],
  categoryId: string | null,
): HistoryEventRow[] {
  if (categoryId == null) return events;
  return events.filter((e) => e.categoryId === categoryId);
}

/** 新しい順のイベントを、日付見出しつきの行にまとめる */
export function groupHistoryByDate(events: HistoryEventRow[], now: number): HistoryListItem[] {
  const items: HistoryListItem[] = [];
  let lastDay: number | null = null;
  for (const event of events) {
    const day = startOfLocalDay(event.createdAt);
    if (day !== lastDay) {
      items.push({
        kind: 'heading',
        key: `heading-${day}`,
        label: formatDateHeading(event.createdAt, now),
      });
      lastDay = day;
    }
    items.push({
      kind: 'event',
      key: event.id,
      event,
      time: formatLocalTime(event.createdAt),
      badge: badgeForEvent(event.type, event.delta),
    });
  }
  return items;
}
