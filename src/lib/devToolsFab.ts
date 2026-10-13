import { usePathname } from 'expo-router';
import { useEffect } from 'react';

/** 購入画面・編集シートなど、フルスクリーン／モーダル中は開発用歯車を隠す */
const HIDDEN_PATH_PREFIXES = ['/paywall', '/counter/'];

export function shouldHideDevToolsFab(pathname: string): boolean {
  return HIDDEN_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

type DevClientLike = {
  setToolsButtonVisible?: (visible: boolean) => void;
};

type DevMenuPreferencesLike = {
  setPreferencesAsync?: (settings: { showFloatingActionButton?: boolean }) => Promise<unknown>;
};

function loadDevClient(): DevClientLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-dev-client') as DevClientLike;
  } catch {
    return null;
  }
}

function loadDevMenuPreferences(): DevMenuPreferencesLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require('expo-modules-core') as {
      requireOptionalNativeModule?: (name: string) => DevMenuPreferencesLike | null;
    };
    const fromCore = core.requireOptionalNativeModule?.('DevMenuPreferences');
    if (fromCore) return fromCore;
  } catch {
    // Expo Go 以外や未導入でも止めない
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NativeModules } = require('react-native') as {
      NativeModules: { DevMenuPreferences?: DevMenuPreferencesLike };
    };
    return NativeModules.DevMenuPreferences ?? null;
  } catch {
    return null;
  }
}

/**
 * 開発用の歯車FABを出す／隠す。
 * SDK 58 の setToolsButtonVisible と、SDK 57 の DevMenuPreferences の両方を試す。
 */
export function setDevToolsFabVisible(visible: boolean): void {
  try {
    loadDevClient()?.setToolsButtonVisible?.(visible);
  } catch {
    // ネイティブが無くても画面は止めない
  }
  try {
    void loadDevMenuPreferences()?.setPreferencesAsync?.({ showFloatingActionButton: visible });
  } catch {
    // 設定モジュールが無くても画面は止めない
  }
}

/** ルートで使い、モーダル中は FAB を消して内容に重ねない */
export function useHideDevToolsFabOnModals(): void {
  const pathname = usePathname();
  const hide = shouldHideDevToolsFab(pathname);

  useEffect(() => {
    setDevToolsFabVisible(!hide);
    return () => setDevToolsFabVisible(true);
  }, [hide]);
}
