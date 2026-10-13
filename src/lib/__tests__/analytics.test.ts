import { resetShareLockForTests, shareCsvFile } from '@/features/export/share';
import { openPaywall } from '@/lib/purchases';

import {
  ANALYTICS_EVENTS,
  capture,
  COUNT_TAP_FLUSH_SIZE,
  flushCountTapped,
  getPendingCountTapsForTests,
  getPostHogHost,
  getPostHogKey,
  initAnalytics,
  isAllowedAnalyticsEvent,
  noteCountTapped,
  resetAnalyticsForTests,
  sanitizeAnalyticsProps,
  setAnalyticsClientForTests,
  setAnalyticsOptOut,
  type AnalyticsClient,
} from '../analytics';

function mockClient(overrides: Partial<AnalyticsClient> = {}): AnalyticsClient {
  return {
    capture: jest.fn(),
    optOut: jest.fn(),
    optIn: jest.fn(),
    ...overrides,
  };
}

describe('analytics 純粋ロジック', () => {
  it('キーは空・空白を無し、値があれば返す', () => {
    expect(getPostHogKey({})).toBeNull();
    expect(getPostHogKey({ EXPO_PUBLIC_POSTHOG_API_KEY: '  ' })).toBeNull();
    expect(getPostHogKey({ EXPO_PUBLIC_POSTHOG_API_KEY: 'phc_test' })).toBe('phc_test');
  });

  it('ホストの既定値がある', () => {
    expect(getPostHogHost({})).toBe('https://us.i.posthog.com');
    expect(getPostHogHost({ EXPO_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com' })).toBe(
      'https://eu.i.posthog.com',
    );
  });

  it('計画のイベントだけ許可する', () => {
    for (const event of ANALYTICS_EVENTS) {
      expect(isAllowedAnalyticsEvent(event)).toBe(true);
    }
    expect(isAllowedAnalyticsEvent('screen')).toBe(false);
    expect(isAllowedAnalyticsEvent('identify')).toBe(false);
  });

  it('項目名・メモなど入力内容を落とす', () => {
    expect(
      sanitizeAnalyticsProps({
        name: 'マグカップ',
        memo: '棚上段',
        count: 3,
        from: 'history',
        scope: 'all',
        email: 'a@b.c',
      }),
    ).toEqual({ count: 3, from: 'history', scope: 'all' });
    expect(sanitizeAnalyticsProps({ name: 'x' })).toBeUndefined();
    expect(sanitizeAnalyticsProps(null)).toBeUndefined();
  });
});

describe('analytics 送信', () => {
  beforeEach(() => {
    resetAnalyticsForTests();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    resetAnalyticsForTests();
    jest.restoreAllMocks();
  });

  it('通常：許可イベントだけ送る', () => {
    const client = mockClient();
    setAnalyticsClientForTests(client);
    capture('app_open');
    capture('pro_gate_shown', { from: 'csv', name: '秘密' });
    capture('not_a_real_event', { count: 1 });
    expect(client.capture).toHaveBeenCalledTimes(2);
    expect(client.capture).toHaveBeenCalledWith('app_open', undefined);
    expect(client.capture).toHaveBeenCalledWith('pro_gate_shown', { from: 'csv' });
  });

  it('キー無し・クライアント無しは no-op', async () => {
    await initAnalytics();
    capture('app_open');
    noteCountTapped();
    expect(getPendingCountTapsForTests()).toBe(0);
  });

  it('capture が失敗しても投げない', () => {
    const client = mockClient({
      capture: jest.fn(() => {
        throw new Error('network');
      }),
    });
    setAnalyticsClientForTests(client);
    expect(() => capture('app_open')).not.toThrow();
  });

  it('count_tapped はまとめて送り、連打でも毎回は送らない', () => {
    const client = mockClient();
    setAnalyticsClientForTests(client);

    for (let i = 0; i < COUNT_TAP_FLUSH_SIZE - 1; i += 1) {
      noteCountTapped();
    }
    expect(client.capture).not.toHaveBeenCalled();
    expect(getPendingCountTapsForTests()).toBe(COUNT_TAP_FLUSH_SIZE - 1);

    noteCountTapped();
    expect(client.capture).toHaveBeenCalledTimes(1);
    expect(client.capture).toHaveBeenCalledWith('count_tapped', { count: COUNT_TAP_FLUSH_SIZE });
    expect(getPendingCountTapsForTests()).toBe(0);

    noteCountTapped();
    noteCountTapped();
    flushCountTapped();
    expect(client.capture).toHaveBeenCalledWith('count_tapped', { count: 2 });
  });

  it('オプトアウト中は送らない', () => {
    const client = mockClient();
    setAnalyticsClientForTests(client);
    setAnalyticsOptOut(true);
    capture('app_open');
    noteCountTapped();
    expect(client.capture).not.toHaveBeenCalled();
    expect(client.optOut).toHaveBeenCalled();
  });

  it('init は連打しても1回', async () => {
    const client = mockClient();
    setAnalyticsClientForTests(client);
    await Promise.all([initAnalytics(), initAnalytics(), initAnalytics()]);
    expect(client.capture).toHaveBeenCalledTimes(1);
    expect(client.capture).toHaveBeenCalledWith('app_open', undefined);
  });

  it('購入画面・CSV成功をイベントだけ送る（ファイル名は送らない）', async () => {
    const client = mockClient();
    setAnalyticsClientForTests(client);

    openPaywall('history');
    expect(client.capture).toHaveBeenCalledWith('pro_gate_shown', { from: 'history' });

    resetShareLockForTests();
    await shareCsvFile('counter_棚A_20261013.csv', '項目名,数\r\nA,1\r\n', {
      isAvailable: async () => true,
      writeCsv: async () => 'file:///tmp/out.csv',
      share: async () => {},
    });
    expect(client.capture).toHaveBeenCalledWith('csv_exported', undefined);
    const payloads = (client.capture as jest.Mock).mock.calls.map((call: unknown[]) => call[1]);
    expect(payloads.some((p) => p && JSON.stringify(p).includes('棚A'))).toBe(false);
  });
});
