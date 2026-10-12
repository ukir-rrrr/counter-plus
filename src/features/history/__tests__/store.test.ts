import { waitForCounterWrites } from '@/features/counters/store';

import { listHistoryEvents } from '../repository';
import { useHistoryStore } from '../store';

jest.mock('../repository', () => ({
  listHistoryEvents: jest.fn(),
}));

jest.mock('@/features/counters/store', () => ({
  waitForCounterWrites: jest.fn(async () => {}),
}));

const listMock = listHistoryEvents as jest.MockedFunction<typeof listHistoryEvents>;
const waitMock = waitForCounterWrites as jest.MockedFunction<typeof waitForCounterWrites>;

describe('useHistoryStore', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    useHistoryStore.setState({ events: [], viewedAt: 0, isLoading: true, error: null });
    listMock.mockReset();
    waitMock.mockReset();
    waitMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('通常：書き込み待ちのあとイベントを載せる', async () => {
    const rows = [
      {
        id: 'e1',
        counterId: 'c1',
        counterName: 'ノート',
        categoryId: 'cat-1',
        categoryName: '棚 A',
        delta: 1,
        countAfter: 3,
        type: 'increment' as const,
        createdAt: 1,
      },
    ];
    listMock.mockResolvedValue(rows);

    await useHistoryStore.getState().load();

    expect(waitMock).toHaveBeenCalled();
    expect(listMock).toHaveBeenCalled();
    expect(useHistoryStore.getState().events).toEqual(rows);
    expect(useHistoryStore.getState().viewedAt).toBeGreaterThan(0);
    expect(useHistoryStore.getState().isLoading).toBe(false);
    expect(useHistoryStore.getState().error).toBeNull();
  });

  it('空データ：履歴0件でもエラーにしない', async () => {
    listMock.mockResolvedValue([]);
    await useHistoryStore.getState().load();
    expect(useHistoryStore.getState().events).toEqual([]);
    expect(useHistoryStore.getState().error).toBeNull();
  });

  it('読み込み失敗は error に入れる', async () => {
    listMock.mockRejectedValue(new Error('db locked'));
    await useHistoryStore.getState().load();
    expect(useHistoryStore.getState().events).toEqual([]);
    expect(useHistoryStore.getState().error).toBe('db locked');
    expect(useHistoryStore.getState().isLoading).toBe(false);
  });

  it('Error 以外の例外も文言にする', async () => {
    listMock.mockRejectedValue('boom');
    await useHistoryStore.getState().load();
    expect(useHistoryStore.getState().error).toBe('履歴を読み込めませんでした');
  });

  it('連打 load でも最後の結果が残る', async () => {
    let resolveFirst: (v: []) => void = () => {};
    const first = new Promise<[]>((resolve) => {
      resolveFirst = resolve;
    });
    listMock.mockReturnValueOnce(first).mockResolvedValueOnce([
      {
        id: 'later',
        counterId: 'c1',
        counterName: '後',
        categoryId: 'cat-1',
        categoryName: '棚 A',
        delta: 1,
        countAfter: 1,
        type: 'increment',
        createdAt: 2,
      },
    ]);

    const p1 = useHistoryStore.getState().load();
    const p2 = useHistoryStore.getState().load();
    resolveFirst([]);
    await Promise.all([p1, p2]);

    expect(useHistoryStore.getState().events[0]?.id).toBe('later');
  });
});
