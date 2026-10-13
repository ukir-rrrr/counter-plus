import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

/** architecture.md の計測イベント。これ以外は送らない */
export const ANALYTICS_EVENTS = [
  'app_open',
  'counter_created',
  'category_created',
  'count_tapped',
  'pro_gate_shown',
  'purchase_completed',
  'csv_exported',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

const EVENT_SET = new Set<string>(ANALYTICS_EVENTS);

/** 送ってよいプロパティ。項目名やメモは含めない */
export const ALLOWED_PROP_KEYS = ['count', 'from', 'scope'] as const;
export type AnalyticsPropKey = (typeof ALLOWED_PROP_KEYS)[number];

const PROP_SET = new Set<string>(ALLOWED_PROP_KEYS);

export const COUNT_TAP_FLUSH_SIZE = 10;
export const COUNT_TAP_FLUSH_MS = 30_000;

export const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';

export type AnalyticsProps = {
  count?: number;
  from?: string;
  scope?: 'current' | 'all';
};

export type AnalyticsClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  optOut?: () => void;
  optIn?: () => void;
};

function isExpoGoEnv(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default as {
      executionEnvironment?: string;
      appOwnership?: string | null;
    };
    return Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
  } catch {
    return false;
  }
}

export function getPostHogKey(env: Record<string, string | undefined> = process.env): string | null {
  const raw = env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim() ?? '';
  return raw.length > 0 ? raw : null;
}

export function getPostHogHost(env: Record<string, string | undefined> = process.env): string {
  const raw = env.EXPO_PUBLIC_POSTHOG_HOST?.trim() ?? '';
  return raw.length > 0 ? raw : DEFAULT_POSTHOG_HOST;
}

export function isAllowedAnalyticsEvent(event: string): event is AnalyticsEvent {
  return EVENT_SET.has(event);
}

/** 許可したキー以外と、文字列のユーザー入力を落とす */
export function sanitizeAnalyticsProps(props?: Record<string, unknown> | null): AnalyticsProps | undefined {
  if (!props) return undefined;
  const next: AnalyticsProps = {};
  if (PROP_SET.has('count') && typeof props.count === 'number' && Number.isFinite(props.count)) {
    next.count = props.count;
  }
  if (typeof props.from === 'string' && props.from.length > 0 && props.from.length <= 32) {
    next.from = props.from;
  }
  if (props.scope === 'current' || props.scope === 'all') {
    next.scope = props.scope;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

let injectedClient: AnalyticsClient | null = null;
let client: AnalyticsClient | null = null;
let optedOut = false;
let initPromise: Promise<void> | null = null;
let pendingCountTaps = 0;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let appStateSub: NativeEventSubscription | null = null;

function tryCreatePostHog(apiKey: string, host: string): AnalyticsClient | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('posthog-react-native') as {
      default?: new (key: string, options: Record<string, unknown>) => AnalyticsClient;
      PostHog?: new (key: string, options: Record<string, unknown>) => AnalyticsClient;
    };
    const Ctor = mod.default ?? mod.PostHog;
    if (!Ctor) return null;
    return new Ctor(apiKey, {
      host,
      captureAppLifecycleEvents: false,
      enableSessionReplay: false,
      disableGeoip: true,
      persistence: 'memory',
    });
  } catch (e) {
    console.warn('PostHog を読み込めませんでした', e);
    return null;
  }
}

function getClient(): AnalyticsClient | null {
  return injectedClient ?? client;
}

export function capture(event: string, props?: Record<string, unknown>): void {
  if (optedOut) return;
  if (!isAllowedAnalyticsEvent(event)) return;
  const target = getClient();
  if (!target) return;
  try {
    const sanitized = sanitizeAnalyticsProps(props);
    target.capture(event, sanitized);
  } catch (e) {
    console.warn('計測イベントを送れませんでした', e);
  }
}

export function noteCountTapped(): void {
  if (optedOut || !getClient()) return;
  pendingCountTaps += 1;
  if (pendingCountTaps >= COUNT_TAP_FLUSH_SIZE) {
    flushCountTapped();
    return;
  }
  if (flushTimer == null) {
    flushTimer = setTimeout(() => {
      flushCountTapped();
    }, COUNT_TAP_FLUSH_MS);
  }
}

export function flushCountTapped(): void {
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = undefined;
  }
  if (pendingCountTaps === 0) return;
  const count = pendingCountTaps;
  pendingCountTaps = 0;
  capture('count_tapped', { count });
}

export function getPendingCountTapsForTests(): number {
  return pendingCountTaps;
}

export function setAnalyticsOptOut(value: boolean): void {
  optedOut = value;
  const target = getClient();
  try {
    if (value) {
      flushCountTapped();
      target?.optOut?.();
    } else {
      target?.optIn?.();
    }
  } catch (e) {
    console.warn('計測のオプトアウト設定に失敗しました', e);
  }
}

function subscribeBackgroundFlush(): void {
  if (appStateSub) return;
  appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'background' || state === 'inactive') {
      flushCountTapped();
    }
  });
}

async function runInitAnalytics(): Promise<void> {
  try {
    if (optedOut) return;
    if (injectedClient) {
      client = injectedClient;
    } else {
      if (isExpoGoEnv()) return;
      const apiKey = getPostHogKey();
      if (!apiKey) return;
      client = tryCreatePostHog(apiKey, getPostHogHost());
      if (!client) return;
    }

    subscribeBackgroundFlush();
    capture('app_open');
  } catch (e) {
    console.warn('計測の初期化に失敗しました', e);
    client = null;
  }
}

/** 起動時に1回呼ぶ。キーやモジュールが無くてもアプリは止めない */
export async function initAnalytics(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = runInitAnalytics();
  return initPromise;
}

/** テスト用。PostHog クライアントを差し替える */
export function setAnalyticsClientForTests(value: AnalyticsClient | null): void {
  injectedClient = value;
}

/** テスト用。状態とロックを初期化する */
export function resetAnalyticsForTests(): void {
  injectedClient = null;
  client = null;
  optedOut = false;
  initPromise = null;
  pendingCountTaps = 0;
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = undefined;
  }
  appStateSub?.remove();
  appStateSub = null;
}
