import { render } from '@testing-library/react-native';

import { HistoryList } from '../components/HistoryList';
import type { HistoryListItem } from '../group';

function eventItem(overrides: Partial<Extract<HistoryListItem, { kind: 'event' }>> = {}): HistoryListItem {
  return {
    kind: 'event',
    key: 'e1',
    time: '09:16',
    badge: { kind: 'increment', label: '+1' },
    event: {
      id: 'e1',
      counterId: 'c1',
      counterName: 'マグカップ 白',
      categoryId: 'cat-a',
      categoryName: '棚 A',
      delta: 1,
      countAfter: 24,
      type: 'increment',
      createdAt: 0,
    },
    ...overrides,
  };
}

function classTokens(className: unknown): string[] {
  return typeof className === 'string' ? className.split(/\s+/).filter(Boolean) : [];
}

describe('HistoryList', () => {
  it('空なら案内文を出す', async () => {
    const { getByTestId, getByText } = await render(
      <HistoryList items={[]} emptyMessage="履歴はまだありません" />,
    );
    expect(getByTestId('history-empty')).toBeTruthy();
    expect(getByText('履歴はまだありません')).toBeTruthy();
  });

  it('時刻「09:16」を1行で出し、固定幅 w-10 は使わない', async () => {
    const { getByTestId, getByText } = await render(
      <HistoryList items={[eventItem()]} emptyMessage="履歴はまだありません" />,
    );

    const time = getByTestId('history-event-time-0');
    expect(time.props.children).toBe('09:16');
    expect(time.props.numberOfLines).toBe(1);

    const tokens = classTokens(time.props.className);
    expect(tokens).not.toContain('w-10');
    expect(tokens).toContain('shrink-0');
    expect(tokens).toContain('min-w-10');
    expect(tokens).toContain('font-mono-medium');
    expect(tokens).toContain('tabular-nums');

    // 行の他要素は残る（名前が縮み、バッジと数は固定側）
    expect(getByText('マグカップ 白')).toBeTruthy();
    expect(getByText('棚 A')).toBeTruthy();
    expect(getByText('+1')).toBeTruthy();
    expect(getByText('→ 24')).toBeTruthy();
  });

  it('見出しと複数行でも時刻は折り返さず、他列の構造を崩さない', async () => {
    const items: HistoryListItem[] = [
      { kind: 'heading', key: 'h1', label: '今日 10月21日' },
      eventItem(),
      eventItem({
        key: 'e2',
        time: '18:42',
        badge: { kind: 'decrement', label: '−1' },
        event: {
          id: 'e2',
          counterId: 'c2',
          counterName: 'とても長い項目名でも1行に収める',
          categoryId: 'cat-b',
          categoryName: '棚 B',
          delta: -1,
          countAfter: 3,
          type: 'decrement',
          createdAt: 1,
        },
      }),
    ];

    const { getByTestId, getByText } = await render(
      <HistoryList items={items} emptyMessage="履歴はまだありません" />,
    );

    const firstTime = getByTestId('history-event-time-1');
    const secondTime = getByTestId('history-event-time-2');
    expect(firstTime.props.children).toBe('09:16');
    expect(secondTime.props.children).toBe('18:42');
    expect(firstTime.props.numberOfLines).toBe(1);
    expect(secondTime.props.numberOfLines).toBe(1);
    expect(classTokens(firstTime.props.className)).not.toContain('w-10');
    expect(classTokens(secondTime.props.className)).not.toContain('w-10');

    expect(getByText('今日 10月21日')).toBeTruthy();
    expect(getByText('とても長い項目名でも1行に収める')).toBeTruthy();
    expect(getByText('棚 B')).toBeTruthy();
    expect(getByText('−1')).toBeTruthy();
    expect(getByText('→ 3')).toBeTruthy();
  });
});
