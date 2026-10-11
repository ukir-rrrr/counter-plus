import type { Counter } from '@/db/schema';

import { deleteCounter, listCounters } from '../repository';
import { selectTotal, useCountersStore } from '../store';

jest.mock('../repository', () => ({
  listCounters: jest.fn(),
  deleteCounter: jest.fn(),
  createCounter: jest.fn(),
  moveCounter: jest.fn(),
  saveCount: jest.fn(),
  undoReset: jest.fn(),
  updateCounter: jest.fn(),
}));

const listCountersMock = listCounters as jest.MockedFunction<typeof listCounters>;
const deleteCounterMock = deleteCounter as jest.MockedFunction<typeof deleteCounter>;

function makeCounter(id: string, name: string, count = 0): Counter {
  return {
    id,
    categoryId: 'cat-1',
    name,
    count,
    memo: '',
    color: 'gray',
    sortOrder: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

function seed(rows: Counter[]) {
  useCountersStore.setState({
    categoryId: 'cat-1',
    ids: rows.map((r) => r.id),
    byId: Object.fromEntries(rows.map((r) => [r.id, r])),
    pendingUndo: null,
  });
}

describe('useCountersStore.remove', () => {
  let dbRows: Counter[];

  beforeEach(() => {
    dbRows = [
      makeCounter('alpha', 'Alpha', 1),
      makeCounter('bravo', 'Bravo', 2),
      makeCounter('charlie', 'Charlie', 3),
    ];
    seed(dbRows);

    deleteCounterMock.mockImplementation((id: string) => {
      dbRows = dbRows.filter((r) => r.id !== id);
    });
    listCountersMock.mockImplementation(async () => [...dbRows]);
  });

  it('削除直後に ids / byId / 項目数がストアから消える', () => {
    useCountersStore.getState().remove('alpha');

    const state = useCountersStore.getState();
    expect(state.ids).toEqual(['bravo', 'charlie']);
    expect(state.byId.alpha).toBeUndefined();
    expect(state.ids.length).toBe(2);
    expect(selectTotal(state)).toBe(5);
  });

  it('ホームがフォーカスで load しても、書き込み待ちのあと削除済みのまま', async () => {
    useCountersStore.getState().remove('alpha');
    expect(useCountersStore.getState().ids).toEqual(['bravo', 'charlie']);

    // 編集シートを閉じたあとの useFocusEffect 相当
    await useCountersStore.getState().load('cat-1');

    const state = useCountersStore.getState();
    expect(deleteCounterMock).toHaveBeenCalledWith('alpha');
    expect(listCountersMock).toHaveBeenCalled();
    expect(state.ids).toEqual(['bravo', 'charlie']);
    expect(state.byId.alpha).toBeUndefined();
    expect(state.ids.length).toBe(2);
  });

  it('load は deleteCounter が終わるまで DB を読まない', async () => {
    const order: string[] = [];
    deleteCounterMock.mockImplementation((id: string) => {
      order.push('delete');
      dbRows = dbRows.filter((r) => r.id !== id);
    });
    listCountersMock.mockImplementation(async () => {
      order.push('list');
      return [...dbRows];
    });

    useCountersStore.getState().remove('alpha');
    await useCountersStore.getState().load('cat-1');

    expect(order).toEqual(['delete', 'list']);
  });

  it('連続削除（連打）しても両方消える', async () => {
    useCountersStore.getState().remove('alpha');
    useCountersStore.getState().remove('bravo');

    expect(useCountersStore.getState().ids).toEqual(['charlie']);

    await useCountersStore.getState().load('cat-1');

    expect(useCountersStore.getState().ids).toEqual(['charlie']);
    expect(deleteCounterMock).toHaveBeenCalledWith('alpha');
    expect(deleteCounterMock).toHaveBeenCalledWith('bravo');
  });

  it('同じIDを連打しても1件だけ消える', async () => {
    useCountersStore.getState().remove('alpha');
    useCountersStore.getState().remove('alpha');

    await useCountersStore.getState().load('cat-1');

    expect(useCountersStore.getState().ids).toEqual(['bravo', 'charlie']);
  });

  it('存在しないIDを削除してもリストは変わらない', async () => {
    useCountersStore.getState().remove('missing');
    await useCountersStore.getState().load('cat-1');
    expect(useCountersStore.getState().ids).toEqual(['alpha', 'bravo', 'charlie']);
  });
});
