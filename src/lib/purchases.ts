import { AppState, Platform, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { create } from 'zustand';

import { releaseNavLock, resetNavLockForTests, tryAcquireNavLock } from '@/lib/navLock';

/** RevenueCat の Entitlement 識別子。ダッシュボード側と揃える */
export const PRO_ENTITLEMENT_ID = 'pro';

/** 買い切り商品ID。App Store Connect / RevenueCat と揃える */
export const PRO_PRODUCT_ID = 'pro_lifetime';

export const FREE_CATEGORY_LIMIT = 1;

export const DEV_BUILD_ONLY_MESSAGE = '開発ビルドでのみ利用できます';
export const PURCHASE_NOT_CONFIGURED_MESSAGE = '購入の設定が完了していません';
export const NO_OFFERINGS_MESSAGE = '購入できる商品が見つかりませんでした';
export const PURCHASE_FAILED_MESSAGE = '購入できませんでした。もう一度試してください。';
export const RESTORE_FAILED_MESSAGE = '購入を復元できませんでした。もう一度試してください。';
export const RESTORE_OK_MESSAGE = '購入を復元しました';
export const RESTORE_NONE_MESSAGE = '復元できる購入がありません';
export const OFFERINGS_LOAD_FAILED_MESSAGE = '購入情報を読み込めませんでした';
export const PRICE_UNAVAILABLE_MESSAGE = '価格は開発ビルドで表示されます';

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

export type EntitlementCache = {
  read: () => boolean | null;
  write: (isPro: boolean) => void;
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
let lastRefreshFailed = false;
let initPromise: Promise<void> | null = null;
let refreshInFlight: Promise<void> | null = null;
let gateInFlight: Promise<boolean> | null = null;
let appStateSub: NativeEventSubscription | null = null;
let memoryCache: boolean | null = null;

function defaultEntitlementCache(): EntitlementCache {
  return {
    read: () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('@/features/purchases/entitlementCache').readCachedIsPro() as boolean | null;
      } catch {
        return null;
      }
    },
    write: (isPro) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@/features/purchases/entitlementCache').writeCachedIsPro(isPro);
      } catch {
        // 起動直後のDB未準備でも止めない
      }
    },
  };
}

function memoryEntitlementCache(): EntitlementCache {
  return {
    read: () => memoryCache,
    write: (isPro) => {
      memoryCache = isPro;
    },
  };
}

let entitlementCache: EntitlementCache = defaultEntitlementCache();

export function messageForUnavailable(reason: UnavailableReason | null | undefined): string {
  return reason === 'no_key' ? PURCHASE_NOT_CONFIGURED_MESSAGE : DEV_BUILD_ONLY_MESSAGE;
}

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

export function getApiKey(os: string = Platform.OS): string | null {
  // Metro が本番バンドルで値を埋め込むので、process.env.EXPO_PUBLIC_* を直接書く
  const raw =
    os === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  const key = raw?.trim() ?? '';
  return key.length > 0 ? key : null;
}

export function inspectPurchasesAvailability(os: string = Platform.OS): PurchasesAvailability {
  if (availabilityOverride) return availabilityOverride;
  if (injectedClient) return { available: true };
  if (isExpoGoEnv()) return { available: false, reason: 'expo_go' };
  if (!isNativeStorePlatform(os) || !hasNativeModule()) {
    return { available: false, reason: 'no_native' };
  }
  if (!getApiKey(os)) return { available: false, reason: 'no_key' };
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

function persistIsPro(isPro: boolean): void {
  usePurchasesStore.setState({ isPro });
  try {
    entitlementCache.write(isPro);
  } catch (e) {
    console.warn('Pro状態を保存できませんでした', e);
  }
}

/** DB準備後に呼び、ネットワーク前から最後に分かっている Pro を使う */
export function hydrateCachedEntitlement(): void {
  try {
    const cached = entitlementCache.read();
    if (cached != null) {
      usePurchasesStore.setState({ isPro: cached });
    }
  } catch (e) {
    console.warn('Pro状態のキャッシュを読めませんでした', e);
  }
}

function applyUnavailable(reason: UnavailableReason): void {
  selectedPackage = null;
  hydrateCachedEntitlement();
  usePurchasesStore.setState({
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
  persistIsPro(isProFromCustomerInfo(info));
}

async function fetchCustomerInfo(client: PurchasesClient): Promise<CustomerInfoLike | null> {
  try {
    const info = await client.getCustomerInfo();
    lastRefreshFailed = false;
    return info;
  } catch (e) {
    console.warn('購入状態を取得できませんでした', e);
    lastRefreshFailed = true;
    return null;
  }
}

function applyOfferings(offerings: OfferingsLike | null): void {
  selectedPackage = selectProPackage(offerings);
  const offeringsError =
    offerings == null ? OFFERINGS_LOAD_FAILED_MESSAGE : selectedPackage == null ? NO_OFFERINGS_MESSAGE : null;
  usePurchasesStore.setState({
    priceString: selectedPackage?.product.priceString ?? null,
    offeringsEmpty: selectedPackage == null,
    offeringsError,
  });
}

async function configureClient(client: PurchasesClient): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey || configured) return true;
  try {
    await client.setLogLevel?.('INFO');
    client.configure({ apiKey });
    configured = true;
    customerInfoListener = (info) => applyCustomerInfo(info);
    client.addCustomerInfoUpdateListener?.(customerInfoListener);
    return true;
  } catch (e) {
    console.warn('RevenueCat の初期化に失敗しました', e);
    applyUnavailable('no_native');
    return false;
  }
}

async function syncFromStore(client: PurchasesClient): Promise<void> {
  const [info, offerings] = await Promise.all([
    fetchCustomerInfo(client),
    client.getOfferings().catch((e: unknown) => {
      console.warn('購入情報を取得できませんでした', e);
      return null;
    }),
  ]);

  if (info != null) {
    persistIsPro(isProFromCustomerInfo(info));
  }

  applyOfferings(offerings);
  usePurchasesStore.setState({
    ready: true,
    available: true,
    unavailableReason: null,
    purchaseInFlight: false,
  });
}

function subscribeForegroundRefresh(): void {
  if (appStateSub) return;
  appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') void refreshPurchases();
  });
}

async function runInitPurchases(): Promise<void> {
  try {
    hydrateCachedEntitlement();
    subscribeForegroundRefresh();

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

    if (!(await configureClient(client))) return;
    await syncFromStore(client);
  } catch (e) {
    console.warn('課金の初期化に失敗しました', e);
    applyUnavailable('no_native');
  }
}

/** 起動時に1回呼ぶ。失敗してもアプリは止めない */
export async function initPurchases(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = runInitPurchases();
  return initPromise;
}

/** フォアグラウンド復帰や制限操作の直前に、購入状態を取り直す */
export async function refreshPurchases(): Promise<void> {
  if (initPromise && !usePurchasesStore.getState().ready) return initPromise;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
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
      if (!(await configureClient(client))) return;
      await syncFromStore(client);
    } catch (e) {
      console.warn('購入状態の再取得に失敗しました', e);
      lastRefreshFailed = true;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

function unavailableResult(reason: UnavailableReason | null | undefined): PurchaseResult {
  return { ok: false, reason: 'unavailable', message: messageForUnavailable(reason) };
}

export async function purchasePro(): Promise<PurchaseResult> {
  if (usePurchasesStore.getState().purchaseInFlight) {
    return { ok: false, reason: 'busy' };
  }

  const availability = inspectPurchasesAvailability();
  if (!availability.available) return unavailableResult(availability.reason);

  const client = getClient();
  if (!client) return unavailableResult('no_native');
  if (!selectedPackage) {
    return { ok: false, reason: 'empty', message: NO_OFFERINGS_MESSAGE };
  }

  usePurchasesStore.setState({ purchaseInFlight: true });
  try {
    const result = await client.purchasePackage(selectedPackage);
    persistIsPro(isProFromCustomerInfo(result.customerInfo));
    usePurchasesStore.setState({ purchaseInFlight: false });
    return { ok: true, isPro: getIsPro() };
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
  if (!availability.available) return unavailableResult(availability.reason);

  const client = getClient();
  if (!client) return unavailableResult('no_native');

  usePurchasesStore.setState({ purchaseInFlight: true });
  try {
    const info = await client.restorePurchases();
    persistIsPro(isProFromCustomerInfo(info));
    usePurchasesStore.setState({ purchaseInFlight: false });
    return { ok: true, isPro: getIsPro() };
  } catch (e) {
    usePurchasesStore.setState({ purchaseInFlight: false });
    if (isPurchaseCancelled(e)) {
      return { ok: false, reason: 'cancelled' };
    }
    console.warn('購入の復元に失敗しました', e);
    return { ok: false, reason: 'error', message: RESTORE_FAILED_MESSAGE };
  }
}

/** Proかどうかの判定はここだけを見る（フックが使えない場所向け） */
export function getIsPro(): boolean {
  return usePurchasesStore.getState().isPro;
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
  if (!tryAcquireNavLock()) return;

  try {
    // 設定からの自主オープンはゲートではないので送らない
    if (openedFrom !== 'settings') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/lib/analytics').capture('pro_gate_shown', { from: openedFrom });
    }
    getRouter().push({ pathname: '/paywall', params: { openedFrom } });
  } catch {
    releaseNavLock();
  }
}

async function resolveProOrOpenPaywall(openedFrom: PaywallOpenedFrom): Promise<boolean> {
  if (getIsPro()) {
    if (lastRefreshFailed) void refreshPurchases();
    return true;
  }

  if (!usePurchasesStore.getState().ready) {
    await initPurchases();
    if (getIsPro()) return true;
  } else if (lastRefreshFailed) {
    await refreshPurchases();
    if (getIsPro()) return true;
  }

  openPaywall(openedFrom);
  return false;
}

/** 未準備ならキャッシュ／初期化完了を待ってから判定する。連打では購入画面を1回だけ開く */
export async function requireProOrOpenPaywall(openedFrom: PaywallOpenedFrom): Promise<boolean> {
  if (gateInFlight) {
    await gateInFlight;
    return getIsPro();
  }
  gateInFlight = resolveProOrOpenPaywall(openedFrom).finally(() => {
    gateInFlight = null;
  });
  return gateInFlight;
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

/** テスト用。entitlement キャッシュを差し替える */
export function setEntitlementCacheForTests(cache: EntitlementCache | null): void {
  entitlementCache = cache ?? memoryEntitlementCache();
}

/** テスト用。フォアグラウンド復帰を再現する */
export function notifyPurchasesAppStateForTests(state: AppStateStatus): void {
  if (state === 'active') void refreshPurchases();
}

/** テスト用。状態とロックを初期化する */
export function resetPurchasesForTests(): void {
  resetNavLockForTests();
  injectedClient = null;
  availabilityOverride = null;
  selectedPackage = null;
  configured = false;
  customerInfoListener = null;
  lastRefreshFailed = false;
  initPromise = null;
  refreshInFlight = null;
  gateInFlight = null;
  memoryCache = null;
  entitlementCache = memoryEntitlementCache();
  appStateSub?.remove();
  appStateSub = null;
  usePurchasesStore.setState({ ...initialState });
}
