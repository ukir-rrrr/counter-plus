import { Platform } from 'react-native';
import { create } from 'zustand';

/** RevenueCat の Entitlement 識別子。ダッシュボード側と揃える */
export const PRO_ENTITLEMENT_ID = 'pro';

/** 買い切り商品ID。App Store Connect / RevenueCat と揃える */
export const PRO_PRODUCT_ID = 'pro_lifetime';

export const FREE_CATEGORY_LIMIT = 1;

export const DEV_BUILD_ONLY_MESSAGE = '開発ビルドでのみ利用できます';
export const NO_OFFERINGS_MESSAGE = '購入できる商品が見つかりませんでした';
export const PURCHASE_FAILED_MESSAGE = '購入できませんでした。もう一度試してください。';
export const RESTORE_FAILED_MESSAGE = '購入を復元できませんでした。もう一度試してください。';
export const RESTORE_OK_MESSAGE = '購入を復元しました';
export const RESTORE_NONE_MESSAGE = '復元できる購入がありません';
export const OFFERINGS_LOAD_FAILED_MESSAGE = '購入情報を読み込めませんでした';

export const PAYWALL_OPENED_FROM = ['csv', 'history', 'category', 'sort', 'ads', 'settings'] as const;
export type PaywallOpenedFrom = (typeof PAYWALL_OPENED_FROM)[number];

export type UnavailableReason = 'no_native' | 'no_key' | 'expo_go';

export type PurchasesAvailability =
  | { available: true }
  | { available: false; reason: UnavailableReason };

export type PurchaseReason = 'busy' | 'unavailable' | 'cancelled' | 'empty' | 'error';

export type PurchaseResult =
  | { ok: true; isPro: boolean }
  | { ok: false; reason: PurchaseReason; message?: string };

export type CustomerInfoLike = {
  entitlements: { active: Record<string, { identifier?: string } | undefined> };
};

export type PackageLike = {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
  };
};

export type OfferingsLike = {
  current: {
    lifetime: PackageLike | null;
    availablePackages: PackageLike[];
  } | null;
};

export type PurchasesClient = {
  configure: (config: { apiKey: string }) => void;
  setLogLevel?: (level: string) => void | Promise<void>;
  getCustomerInfo: () => Promise<CustomerInfoLike>;
  getOfferings: () => Promise<OfferingsLike>;
  purchasePackage: (pkg: PackageLike) => Promise<{ customerInfo: CustomerInfoLike }>;
  restorePurchases: () => Promise<CustomerInfoLike>;
  addCustomerInfoUpdateListener?: (listener: (info: CustomerInfoLike) => void) => void;
};

type PurchasesState = {
  isPro: boolean;
  ready: boolean;
  available: boolean;
  unavailableReason: UnavailableReason | null;
  priceString: string | null;
  offeringsEmpty: boolean;
  offeringsError: string | null;
  purchaseInFlight: boolean;
};

const initialState: Omit<PurchasesState, never> = {
  isPro: false,
  ready: false,
  available: false,
  unavailableReason: null,
  priceString: null,
  offeringsEmpty: false,
  offeringsError: null,
  purchaseInFlight: false,
};

export const usePurchasesStore = create<PurchasesState>(() => ({ ...initialState }));

let selectedPackage: PackageLike | null = null;
let injectedClient: PurchasesClient | null = null;
let availabilityOverride: PurchasesAvailability | null = null;
let configured = false;
let customerInfoListener: ((info: CustomerInfoLike) => void) | null = null;

function isNativeStorePlatform(os: string = Platform.OS): boolean {
  return os === 'ios' || os === 'android';
}

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

function hasNativeModule(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NativeModules } = require('react-native') as {
      NativeModules: { RNPurchases?: unknown };
    };
    return NativeModules.RNPurchases != null;
  } catch {
    return false;
  }
}

export function getApiKey(
  env: Record<string, string | undefined> = process.env,
  os: string = Platform.OS,
): string | null {
  const raw = os === 'ios' ? env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  const key = raw?.trim() ?? '';
  return key.length > 0 ? key : null;
}

export function inspectPurchasesAvailability(
  env: Record<string, string | undefined> = process.env,
  os: string = Platform.OS,
): PurchasesAvailability {
  if (availabilityOverride) return availabilityOverride;
  if (injectedClient) return { available: true };
  if (isExpoGoEnv()) return { available: false, reason: 'expo_go' };
  if (!isNativeStorePlatform(os) || !hasNativeModule()) {
    return { available: false, reason: 'no_native' };
  }
  if (!getApiKey(env, os)) return { available: false, reason: 'no_key' };
  return { available: true };
}

function tryCreateNativeClient(): PurchasesClient | null {
  try {
    if (!hasNativeModule()) return null;
    // Expo Go ではネイティブモジュールが無く落ちることがあるので、存在確認後にだけ読む
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases') as {
      default: {
        configure: (config: { apiKey: string }) => void;
        setLogLevel: (level: string) => Promise<void>;
        getCustomerInfo: () => Promise<CustomerInfoLike>;
        getOfferings: () => Promise<OfferingsLike>;
        purchasePackage: (pkg: PackageLike) => Promise<{ customerInfo: CustomerInfoLike }>;
        restorePurchases: () => Promise<CustomerInfoLike>;
        addCustomerInfoUpdateListener: (listener: (info: CustomerInfoLike) => void) => void;
      };
    };
    const Purchases = mod.default;
    return {
      configure: (config) => Purchases.configure(config),
      setLogLevel: (level) => Purchases.setLogLevel(level),
      getCustomerInfo: () => Purchases.getCustomerInfo(),
      getOfferings: () => Purchases.getOfferings(),
      purchasePackage: (pkg) => Purchases.purchasePackage(pkg),
      restorePurchases: () => Purchases.restorePurchases(),
      addCustomerInfoUpdateListener: (listener) => Purchases.addCustomerInfoUpdateListener(listener),
    };
  } catch (e) {
    console.warn('RevenueCat を読み込めませんでした', e);
    return null;
  }
}

function getClient(): PurchasesClient | null {
  return injectedClient ?? tryCreateNativeClient();
}

export function isProFromCustomerInfo(info: CustomerInfoLike | null | undefined): boolean {
  return info?.entitlements.active[PRO_ENTITLEMENT_ID] != null;
}

export function selectProPackage(offerings: OfferingsLike | null | undefined): PackageLike | null {
  const current = offerings?.current;
  if (!current) return null;
  if (current.lifetime) return current.lifetime;
  const byId = current.availablePackages.find(
    (pkg) => pkg.product.identifier === PRO_PRODUCT_ID || pkg.identifier === PRO_PRODUCT_ID,
  );
  return byId ?? current.availablePackages[0] ?? null;
}

export function canAddCategory(isPro: boolean, currentCount: number): boolean {
  return isPro || currentCount < FREE_CATEGORY_LIMIT;
}

export function parseOpenedFrom(value: string | string[] | undefined): PaywallOpenedFrom {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && (PAYWALL_OPENED_FROM as readonly string[]).includes(raw)) {
    return raw as PaywallOpenedFrom;
  }
  return 'settings';
}

export function isPurchaseCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { userCancelled?: boolean | null; code?: string | number };
  if (err.userCancelled) return true;
  return String(err.code) === '1' || String(err.code) === 'PURCHASE_CANCELLED_ERROR';
}

function applyUnavailable(reason: UnavailableReason): void {
  selectedPackage = null;
  usePurchasesStore.setState({
    isPro: false,
    ready: true,
    available: false,
    unavailableReason: reason,
    priceString: null,
    offeringsEmpty: false,
    offeringsError: null,
    purchaseInFlight: false,
  });
}

function applyCustomerInfo(info: CustomerInfoLike | null | undefined): void {
  usePurchasesStore.setState({ isPro: isProFromCustomerInfo(info) });
}

/** 起動時に1回呼ぶ。失敗してもアプリは止めない */
export async function initPurchases(): Promise<void> {
  try {
    const availability = inspectPurchasesAvailability();
    if (!availability.available) {
      applyUnavailable(availability.reason);
      return;
    }

    const client = getClient();
    if (!client) {
      applyUnavailable('no_native');
      return;
    }

    const apiKey = getApiKey();
    if (apiKey && !configured) {
      try {
        await client.setLogLevel?.('INFO');
        client.configure({ apiKey });
        configured = true;
        customerInfoListener = (info) => applyCustomerInfo(info);
        client.addCustomerInfoUpdateListener?.(customerInfoListener);
      } catch (e) {
        console.warn('RevenueCat の初期化に失敗しました', e);
        applyUnavailable('no_native');
        return;
      }
    }

    const [info, offerings] = await Promise.all([
      client.getCustomerInfo().catch((e: unknown) => {
        console.warn('購入状態を取得できませんでした', e);
        return null;
      }),
      client.getOfferings().catch((e: unknown) => {
        console.warn('購入情報を取得できませんでした', e);
        return null;
      }),
    ]);

    selectedPackage = selectProPackage(offerings);
    const offeringsError =
      offerings == null ? OFFERINGS_LOAD_FAILED_MESSAGE : selectedPackage == null ? NO_OFFERINGS_MESSAGE : null;

    usePurchasesStore.setState({
      isPro: isProFromCustomerInfo(info),
      ready: true,
      available: true,
      unavailableReason: null,
      priceString: selectedPackage?.product.priceString ?? null,
      offeringsEmpty: selectedPackage == null,
      offeringsError,
      purchaseInFlight: false,
    });
  } catch (e) {
    console.warn('課金の初期化に失敗しました', e);
    applyUnavailable('no_native');
  }
}

function unavailableResult(): PurchaseResult {
  return { ok: false, reason: 'unavailable', message: DEV_BUILD_ONLY_MESSAGE };
}

export async function purchasePro(): Promise<PurchaseResult> {
  if (usePurchasesStore.getState().purchaseInFlight) {
    return { ok: false, reason: 'busy' };
  }

  const availability = inspectPurchasesAvailability();
  if (!availability.available) return unavailableResult();

  const client = getClient();
  if (!client) return unavailableResult();
  if (!selectedPackage) {
    return { ok: false, reason: 'empty', message: NO_OFFERINGS_MESSAGE };
  }

  usePurchasesStore.setState({ purchaseInFlight: true });
  try {
    const result = await client.purchasePackage(selectedPackage);
    const isPro = isProFromCustomerInfo(result.customerInfo);
    usePurchasesStore.setState({ isPro, purchaseInFlight: false });
    return { ok: true, isPro };
  } catch (e) {
    usePurchasesStore.setState({ purchaseInFlight: false });
    if (isPurchaseCancelled(e)) {
      return { ok: false, reason: 'cancelled' };
    }
    console.warn('購入に失敗しました', e);
    return { ok: false, reason: 'error', message: PURCHASE_FAILED_MESSAGE };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (usePurchasesStore.getState().purchaseInFlight) {
    return { ok: false, reason: 'busy' };
  }

  const availability = inspectPurchasesAvailability();
  if (!availability.available) return unavailableResult();

  const client = getClient();
  if (!client) return unavailableResult();

  usePurchasesStore.setState({ purchaseInFlight: true });
  try {
    const info = await client.restorePurchases();
    const isPro = isProFromCustomerInfo(info);
    usePurchasesStore.setState({ isPro, purchaseInFlight: false });
    return { ok: true, isPro };
  } catch (e) {
    usePurchasesStore.setState({ purchaseInFlight: false });
    if (isPurchaseCancelled(e)) {
      return { ok: false, reason: 'cancelled' };
    }
    console.warn('購入の復元に失敗しました', e);
    return { ok: false, reason: 'error', message: RESTORE_FAILED_MESSAGE };
  }
}

/** Proかどうかの判定はここだけを見る */
export function useIsPro(): boolean {
  return usePurchasesStore((s) => s.isPro);
}

function getRouter(): { push: (href: { pathname: string; params?: Record<string, string> }) => void } {
  // 画面遷移は使うときだけ読む。テストで expo-router を読まなくて済む
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-router').router;
}

export function openPaywall(openedFrom: PaywallOpenedFrom = 'settings'): void {
  getRouter().push({ pathname: '/paywall', params: { openedFrom } });
}

export function requireProOrOpenPaywall(openedFrom: PaywallOpenedFrom): boolean {
  if (usePurchasesStore.getState().isPro) return true;
  openPaywall(openedFrom);
  return false;
}

export function destinationAfterPurchase(openedFrom: PaywallOpenedFrom): '/history' | '/export' | null {
  if (openedFrom === 'history') return '/history';
  if (openedFrom === 'csv') return '/export';
  return null;
}

/** テスト用。RevenueCat クライアントを差し替える */
export function setPurchasesClientForTests(client: PurchasesClient | null): void {
  injectedClient = client;
}

/** テスト用。利用可否判定を上書きする */
export function setPurchasesAvailabilityForTests(value: PurchasesAvailability | null): void {
  availabilityOverride = value;
}

/** テスト用。状態とロックを初期化する */
export function resetPurchasesForTests(): void {
  injectedClient = null;
  availabilityOverride = null;
  selectedPackage = null;
  configured = false;
  customerInfoListener = null;
  usePurchasesStore.setState({ ...initialState });
}
