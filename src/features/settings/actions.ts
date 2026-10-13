import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

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

/** ステップ7・9で埋める。空なら「準備中」を出す */
export const supportUrls: Record<SupportId, string> = {
  review: '',
  contact: '',
  terms: '',
  privacy: '',
};

export const UNAVAILABLE_MESSAGE = 'この機能は準備中です。';
export const RESTORE_UNAVAILABLE_MESSAGE = '開発ビルドでのみ利用できます';

export const defaultSupportOpener: SupportOpener = {
  openExternal: async (url) => {
    await Linking.openURL(url);
  },
  openBrowser: async (url) => {
    await WebBrowser.openBrowserAsync(url);
  },
};

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
 * サポートリンクを開く。URLが空なら unavailable。
 * 連打されても同時に1回だけ実行する。
 */
export async function openSupportLink(
  id: SupportId,
  opener: SupportOpener = defaultSupportOpener,
  urls: Record<SupportId, string> = supportUrls,
): Promise<SettingsActionResult> {
  if (supportInFlight) return { ok: false, reason: 'busy' };
  supportInFlight = true;
  try {
    const url = urls[id]?.trim() ?? '';
    if (!url) {
      return { ok: false, reason: 'unavailable', message: UNAVAILABLE_MESSAGE };
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
