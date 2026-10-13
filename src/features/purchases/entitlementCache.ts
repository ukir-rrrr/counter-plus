import { getOptionalBooleanSetting, setBooleanSetting } from '@/features/settings/repository';

/** 最後に確認できた Pro 状態。RevenueCat が正で、ここはオフライン用キャッシュ */
export const CACHED_IS_PRO_KEY = 'is_pro';

export function readCachedIsPro(): boolean | null {
  try {
    return getOptionalBooleanSetting(CACHED_IS_PRO_KEY);
  } catch {
    return null;
  }
}

export function writeCachedIsPro(isPro: boolean): void {
  try {
    setBooleanSetting(CACHED_IS_PRO_KEY, isPro);
  } catch (e) {
    console.warn('Pro状態を保存できませんでした', e);
  }
}
