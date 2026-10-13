import type { Counter } from '@/db/schema';
import {
  getPendingCountTapsForTests,
  resetAnalyticsForTests,
  setAnalyticsClientForTests,
  type AnalyticsClient,
} from '@/lib/analytics';

import { createCounter, saveCount } from '../repository';
import { useCountersStore } from '../store';

jest.mock('../repository', () => ({
  listCounters: jest.fn(),
  deleteCounter: jest.fn(),
  createCounter: jest.fn(),
  moveCounter: jest.fn(),
  saveCount: jest.fn(),
  undoReset: jest.fn(),
  updateCounter: jest.fn(),
}));

const createCounterMock = createCounter as jest.MockedFunction<typeof createCounter>;
const saveCountMock = saveCount as jest.MockedFunction<typeof saveCount>;

function makeCounter(id: string, count = 0): Counter {
  return {
    id,
    categoryId: 'cat-1',
    name: 'マグカップ',
    count,
    memo: '棚上段',
    color: 'gray',
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('カウント計測', () => {
  const client: AnalyticsClient = { capture: jest.fn() };

  beforeEach(() => {
    resetAnalyticsForTests();
    setAnalyticsClientForTests(client);
    (client.capture as jest.Mock).mockClear();
    useCountersStore.setState({
      categoryId: 'cat-1',
      ids: ['alpha'],
      byId: { alpha: makeCounter('alpha', 1) },
      pendingUndo: null,
    });
    saveCountMock.mockReset();
    createCounterMock.mockReset();
  });

  afterEach(() => {
    resetAnalyticsForTests();
  });

  it('＋−の連打はまとめて数え、項目名は送らない', () => {
    const { increment, decrement } = useCountersStore.getState();
    expect(increment('alpha')).toBe(true);
    expect(increment('alpha')).toBe(true);
    expect(decrement('alpha')).toBe(true);
    expect(getPendingCountTapsForTests()).toBe(3);
    expect(client.capture).not.toHaveBeenCalled();
    expect(JSON.stringify((client.capture as jest.Mock).mock.calls)).not.toContain('マグカップ');
  });

  it('0未満にならない操作は計測しない', () => {
    useCountersStore.setState({
      byId: { alpha: makeCounter('alpha', 0) },
    });
    expect(useCountersStore.getState().decrement('alpha')).toBe(false);
    expect(getPendingCountTapsForTests()).toBe(0);
  });

  it('項目追加は counter_created だけで、名前は送らない', () => {
    createCounterMock.mockReturnValue(makeCounter('bravo'));
    useCountersStore.getState().add('シークレット');
    expect(client.capture).toHaveBeenCalledWith('counter_created', undefined);
    const payloads = (client.capture as jest.Mock).mock.calls.map((call: unknown[]) => JSON.stringify(call));
    expect(payloads.some((p) => p.includes('シークレット') || p.includes('マグカップ'))).toBe(false);
  });
});
