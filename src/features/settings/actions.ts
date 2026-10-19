import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { legalRoute, type LegalDocument } from '@/features/legal/content';
import { releaseNavLock, resetNavLockForTests, tryAcquireNavLock } from '@/lib/navLock';
import { restorePurchases as restorePurchasesSdk } from '@/lib/purchases';

export type SettingsActionReason = 'busy' | 'cancelled' | 'unavailable' | 'error';

export type SettingsActionResult =
  | { ok: true; isPro?: boolean }
  | { ok: false; reason: SettingsActionReason; message?: string };

export type SupportId = 'review' | 'contact' | 'terms' | 'privacy';

export type SupportOpener = {
  openExternal: (url: string) => Promise<void>;
  openBrowser: (url: string) => Promise<void>;
};

export type LegalNavigator = (href: '/legal/terms' | '/legal/privacy') => void;

export const UNAVAILABLE_MESSAGE = 'リンクを開けませんでした。';
export const REVIEW_UNAVAILABLE_MESSAGE =
  'App Storeのリンクは、公開用のアプリIDを設定するとここから開けます。';
export const CONTACT_UNAVAILABLE_MESSAGE = 'お問い合わせ先のメールがまだ設定されていません。';
export const RESTORE_UNAVAILABLE_MESSAGE = '開発ビルドでのみ利用できます';

export const defaultSupportOpener: SupportOpener = {
  openExternal: async (url) => {
    await Linking.openURL(url);
  },
  openBrowser: async (url) => {
    await WebBrowser.openBrowserAsync(url);
  },
};

export function appStoreReviewUrl(appStoreId: string | null | undefined): string {
  const id = appStoreId?.trim() ?? '';
  if (!/^\d+$/.test(id)) return '';
  return `https://apps.apple.com/app/id${id}?action=write-review`;
}

export function contactMailtoUrl(email: string | null | undefined): string {
  const trimmed = email?.trim() ?? '';
  if (!trimmed.includes('@') || trimmed.includes(' ')) return '';
  return `mailto:${trimmed}?subject=${encodeURIComponent('カウンター＋についての問い合わせ')}`;
}

/** 設定・購入画面から開く外部リンク。空なら unavailable */
export function getSupportUrls(
  env: Record<string, string | undefined> = process.env,
): Record<SupportId, string> {
  return {
    review: appStoreReviewUrl(env.EXPO_PUBLIC_APP_STORE_ID),
    contact: contactMailtoUrl(env.EXPO_PUBLIC_SUPPORT_EMAIL),
    terms: '',
    privacy: '',
  };
}

function unavailableMessage(id: SupportId): string {
  if (id === 'review') return REVIEW_UNAVAILABLE_MESSAGE;
  if (id === 'contact') return CONTACT_UNAVAILABLE_MESSAGE;
  return UNAVAILABLE_MESSAGE;
}

type RestoreImpl = () => Promise<SettingsActionResult>;

const defaultRestoreImpl: RestoreImpl = async () => {
  const result = await restorePurchasesSdk();
  if (result.ok) return { ok: true, isPro: result.isPro };
  if (result.reason === 'busy' || result.reason === 'cancelled') {
    return { ok: false, reason: result.reason };
  }
  if (result.reason === 'unavailable') {
    return { ok: false, reason: 'unavailable', message: result.message ?? RESTORE_UNAVAILABLE_MESSAGE };
  }
  return { ok: false, reason: 'error', message: result.message };
};

let restoreImpl: RestoreImpl = defaultRestoreImpl;
let restoreInFlight = false;
let supportInFlight = false;

/** テスト用。購入復元の実装を差し替える */
export function setRestorePurchasesImplForTests(impl: RestoreImpl | null): void {
  restoreImpl = impl ?? defaultRestoreImpl;
}

/** テスト用。連打ロックを戻す */
export function resetSettingsActionLocksForTests(): void {
  restoreInFlight = false;
  supportInFlight = false;
  resetNavLockForTests();
}

export function isRestoreInFlight(): boolean {
  return restoreInFlight;
}

export function isSupportInFlight(): boolean {
  return supportInFlight;
}

/**
 * 購入を復元する。RevenueCat（src/lib/purchases.ts）に委譲する。
 * 連打されても同時に1回だけ実行する。
 */
export async function restorePurchases(): Promise<SettingsActionResult> {
  if (restoreInFlight) return { ok: false, reason: 'busy' };
  restoreInFlight = true;
  try {
    return await restoreImpl();
  } catch (e: unknown) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : '購入を復元できませんでした',
    };
  } finally {
    restoreInFlight = false;
  }
}

/**
 * サポートの外部リンクを開く。URLが空なら unavailable。
 * 連打されても同時に1回だけ実行する。
 */
export async function openSupportLink(
  id: SupportId,
  opener: SupportOpener = defaultSupportOpener,
  urls: Record<SupportId, string> = getSupportUrls(),
): Promise<SettingsActionResult> {
  if (supportInFlight) return { ok: false, reason: 'busy' };
  supportInFlight = true;
  try {
    const url = urls[id]?.trim() ?? '';
    if (!url) {
      return { ok: false, reason: 'unavailable', message: unavailableMessage(id) };
    }
    if (id === 'contact') {
      await opener.openExternal(url);
    } else {
      await opener.openBrowser(url);
    }
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : '開けませんでした',
    };
  } finally {
    supportInFlight = false;
  }
}

const defaultLegalNavigate: LegalNavigator = (href) => {
  router.push(href);
};

/**
 * 利用規約・プライバシーポリシーのアプリ内画面を開く。
 * 遷移アニメ中の連打では同じ画面を重ねない（microtask では短すぎる）。
 */
export function openLegalScreen(
  id: LegalDocument['id'],
  navigate: LegalNavigator = defaultLegalNavigate,
): SettingsActionResult {
  if (supportInFlight || !tryAcquireNavLock()) {
    return { ok: false, reason: 'busy' };
  }
  try {
    navigate(legalRoute(id));
    return { ok: true };
  } catch (e: unknown) {
    releaseNavLock();
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : '開けませんでした',
    };
  }
}
