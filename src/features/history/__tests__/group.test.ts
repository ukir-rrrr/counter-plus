import type { CountEventType } from '@/db/schema';

import {
  badgeForEvent,
  filterEventsByCategory,
  formatDateHeading,
  formatLocalTime,
  groupHistoryByDate,
  startOfLocalDay,
} from '../group';
import type { HistoryEventRow } from '../repository';

function event(partial: Partial<HistoryEventRow> & Pick<HistoryEventRow, 'id' | 'createdAt'>): HistoryEventRow {
  return {
    counterId: 'c1',
    counterName: 'マグカップ 白',
    categoryId: 'cat-a',
    categoryName: '棚 A',
    delta: 1,
    countAfter: 1,
    type: 'increment',
    ...partial,
  };
}

describe('startOfLocalDay / 日付境界（タイムゾーンは端末ローカル）', () => {
  it('その日の 0:00 は同じ日の開始', () => {
    const noon = new Date(2026, 9, 9, 12, 0, 0).getTime();
    const start = new Date(2026, 9, 9, 0, 0, 0, 0).getTime();
    expect(startOfLocalDay(noon)).toBe(start);
  });

  it('23:59:59.999 はその日、1ms 前は前日', () => {
    const end = new Date(2026, 9, 9, 23, 59, 59, 999).getTime();
    const before = end + 1;
    expect(startOfLocalDay(end)).toBe(new Date(2026, 9, 9, 0, 0, 0, 0).getTime());
    expect(startOfLocalDay(before)).toBe(new Date(2026, 9, 10, 0, 0, 0, 0).getTime());
  });

  it('UTC の日付とローカル日付がずれてもローカルで日を切る', () => {
    // 2026-10-09 15:30 UTC。JST なら 10/10 00:30、UTC なら 10/09 15:30
    const utcMs = Date.UTC(2026, 9, 9, 15, 30, 0);
    const local = new Date(utcMs);
    const expected = new Date(local.getFullYear(), local.getMonth(), local.getDate()).getTime();
    expect(startOfLocalDay(utcMs)).toBe(expected);
  });
});

describe('formatDateHeading', () => {
  const now = new Date(2026, 9, 9, 18, 0, 0).getTime();

  it('今日は「今日 M月D日」', () => {
    expect(formatDateHeading(new Date(2026, 9, 9, 0, 0, 0).getTime(), now)).toBe('今日 10月9日');
    expect(formatDateHeading(new Date(2026, 9, 9, 23, 59, 59).getTime(), now)).toBe('今日 10月9日');
  });

  it('昨日は「昨日 M月D日」（日付計算で DST もまたげる）', () => {
    expect(formatDateHeading(new Date(2026, 9, 8, 23, 59, 59).getTime(), now)).toBe('昨日 10月8日');
    expect(formatDateHeading(new Date(2026, 9, 8, 0, 0, 0).getTime(), now)).toBe('昨日 10月8日');
  });

  it('一昨日以前は日付のみ。年をまたぐと西暦を付ける', () => {
    expect(formatDateHeading(new Date(2026, 9, 7, 12, 0, 0).getTime(), now)).toBe('10月7日');
    expect(formatDateHeading(new Date(2025, 11, 31, 12, 0, 0).getTime(), now)).toBe('2025年12月31日');
  });
});

describe('formatLocalTime', () => {
  it('HH:mm（ゼロ埋め）', () => {
    expect(formatLocalTime(new Date(2026, 9, 9, 8, 5, 0).getTime())).toBe('08:05');
    expect(formatLocalTime(new Date(2026, 9, 9, 18, 42, 0).getTime())).toBe('18:42');
  });
});

describe('badgeForEvent', () => {
  it('増減は符号つき、編集とリセットは文言', () => {
    expect(badgeForEvent('increment', 1)).toEqual({ kind: 'increment', label: '+1' });
    expect(badgeForEvent('increment', 10)).toEqual({ kind: 'increment', label: '+10' });
    expect(badgeForEvent('decrement', -1)).toEqual({ kind: 'decrement', label: '−1' });
    expect(badgeForEvent('decrement', -5)).toEqual({ kind: 'decrement', label: '−5' });
    expect(badgeForEvent('edit', 37)).toEqual({ kind: 'edit', label: '編集' });
    expect(badgeForEvent('reset', -12)).toEqual({ kind: 'reset', label: '0に' });
  });

  const types: CountEventType[] = ['increment', 'decrement', 'edit', 'reset'];
  it.each(types)('%s は kind が一致する', (type) => {
    expect(badgeForEvent(type, 1).kind).toBe(type);
  });
});

describe('filterEventsByCategory', () => {
  const rows = [
    event({ id: '1', createdAt: 1, categoryId: 'a' }),
    event({ id: '2', createdAt: 2, categoryId: 'b' }),
    event({ id: '3', createdAt: 3, categoryId: 'a' }),
  ];

  it('null はすべて残す', () => {
    expect(filterEventsByCategory(rows, null)).toEqual(rows);
  });

  it('指定カテゴリだけ残す', () => {
    expect(filterEventsByCategory(rows, 'a').map((e) => e.id)).toEqual(['1', '3']);
  });

  it('該当なしは空', () => {
    expect(filterEventsByCategory(rows, 'missing')).toEqual([]);
    expect(filterEventsByCategory([], 'a')).toEqual([]);
  });
});

describe('groupHistoryByDate', () => {
  it('空なら空', () => {
    expect(groupHistoryByDate([], Date.now())).toEqual([]);
  });

  it('日付が変わったところに見出しを入れ、新しい順のままにする', () => {
    const now = new Date(2026, 9, 9, 20, 0, 0).getTime();
    const rows = [
      event({ id: 't1', createdAt: new Date(2026, 9, 9, 18, 42, 0).getTime(), delta: 1, countAfter: 24 }),
      event({ id: 't2', createdAt: new Date(2026, 9, 9, 18, 40, 0).getTime(), type: 'decrement', delta: -1, countAfter: 12 }),
      event({ id: 'y1', createdAt: new Date(2026, 9, 8, 20, 5, 0).getTime(), type: 'reset', delta: -9, countAfter: 0 }),
    ];
    const items = groupHistoryByDate(rows, now);
    expect(items.map((i) => (i.kind === 'heading' ? i.label : i.event.id))).toEqual([
      '今日 10月9日',
      't1',
      't2',
      '昨日 10月8日',
      'y1',
    ]);
    expect(items[1]).toMatchObject({ kind: 'event', time: '18:42', badge: { label: '+1' } });
    expect(items[2]).toMatchObject({ kind: 'event', time: '18:40', badge: { label: '−1' } });
    expect(items[4]).toMatchObject({ kind: 'event', time: '20:05', badge: { label: '0に' } });
  });

  it('日付境界の 0:00 と前日 23:59 は別見出し', () => {
    const now = new Date(2026, 9, 9, 1, 0, 0).getTime();
    const items = groupHistoryByDate(
      [
        event({ id: 'today', createdAt: new Date(2026, 9, 9, 0, 0, 0).getTime() }),
        event({ id: 'yday', createdAt: new Date(2026, 9, 8, 23, 59, 0).getTime() }),
      ],
      now,
    );
    expect(items.filter((i) => i.kind === 'heading').map((i) => i.label)).toEqual(['今日 10月9日', '昨日 10月8日']);
  });
});
