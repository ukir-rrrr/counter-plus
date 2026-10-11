import { selectTotal, MAX_COUNT } from '../features/counters/store';
import type { Counter } from '@/db/schema';

// CountersState のモック型
type MockState = {
  categoryId: string | null;
  ids: string[];
  byId: Record<string, Counter>;
  pendingUndo: null;
};

const createCounter = (id: string, count: number): Counter => ({
  id,
  categoryId: 'cat-1',
  name: `Counter ${id}`,
  count,
  memo: '',
  color: 'blue',
  sortOrder: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const createState = (counters: Counter[]): MockState => ({
  categoryId: 'cat-1',
  ids: counters.map((c) => c.id),
  byId: Object.fromEntries(counters.map((c) => [c.id, c])),
  pendingUndo: null,
});

describe('selectTotal', () => {
  describe('正常系', () => {
    it('空のリストは 0 を返す', () => {
      const state = createState([]);
       
      expect(selectTotal(state as any)).toBe(0);
    });

    it('1つの項目の合計を返す', () => {
      const state = createState([createCounter('1', 5)]);
       
      expect(selectTotal(state as any)).toBe(5);
    });

    it('複数の項目の合計を返す', () => {
      const state = createState([createCounter('1', 5), createCounter('2', 10), createCounter('3', 15)]);
       
      expect(selectTotal(state as any)).toBe(30);
    });

    it('ゼロを含む項目も正しく計算する', () => {
      const state = createState([createCounter('1', 0), createCounter('2', 10), createCounter('3', 0)]);
       
      expect(selectTotal(state as any)).toBe(10);
    });

    it('大きな数値も正しく計算する', () => {
      const state = createState([createCounter('1', MAX_COUNT), createCounter('2', 1)]);
       
      expect(selectTotal(state as any)).toBe(MAX_COUNT + 1);
    });
  });

  describe('エッジケース', () => {
    it('ids にあるが byId にない項目は 0 として扱う', () => {
      const state = {
        categoryId: 'cat-1',
        ids: ['1', 'missing', '3'],
        byId: {
          '1': createCounter('1', 5),
          '3': createCounter('3', 15),
        },
        pendingUndo: null,
      };
       
      expect(selectTotal(state as any)).toBe(20);
    });

    it('すべての項目が 0 の場合は 0 を返す', () => {
      const state = createState([createCounter('1', 0), createCounter('2', 0), createCounter('3', 0)]);
       
      expect(selectTotal(state as any)).toBe(0);
    });
  });
});

describe('MAX_COUNT', () => {
  it('999,999,999 である', () => {
    expect(MAX_COUNT).toBe(999_999_999);
  });

  it('10桁未満の整数である', () => {
    expect(MAX_COUNT.toString().length).toBeLessThan(10);
  });
});
