import { router } from 'expo-router';

import {
  canAddCategory,
  DEV_BUILD_ONLY_MESSAGE,
  destinationAfterPurchase,
  FREE_CATEGORY_LIMIT,
  getApiKey,
  initPurchases,
  inspectPurchasesAvailability,
  isProFromCustomerInfo,
  isPurchaseCancelled,
  NO_OFFERINGS_MESSAGE,
  openPaywall,
  parseOpenedFrom,
  PRO_ENTITLEMENT_ID,
  PRO_PRODUCT_ID,
  PURCHASE_FAILED_MESSAGE,
  purchasePro,
  requireProOrOpenPaywall,
  resetPurchasesForTests,
  RESTORE_FAILED_MESSAGE,
  restorePurchases,
  selectProPackage,
  setPurchasesAvailabilityForTests,
  setPurchasesClientForTests,
  usePurchasesStore,
  type CustomerInfoLike,
  type OfferingsLike,
  type PackageLike,
  type PurchasesClient,
} from '../purchases';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
}));

function proInfo(isPro: boolean): CustomerInfoLike {
  return {
    entitlements: {
      active: isPro ? { [PRO_ENTITLEMENT_ID]: { identifier: PRO_ENTITLEMENT_ID } } : {},
    },
  };
}

function pkg(priceString = '¥800'): PackageLike {
  return {
    identifier: PRO_PRODUCT_ID,
    product: { identifier: PRO_PRODUCT_ID, priceString },
  };
}

function offerings(packages: PackageLike[], lifetime: PackageLike | null = null): OfferingsLike {
  return { current: { lifetime, availablePackages: packages } };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockClient(overrides: Partial<PurchasesClient> = {}): PurchasesClient {
  return {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getCustomerInfo: jest.fn(async () => proInfo(false)),
    getOfferings: jest.fn(async () => offerings([pkg()])),
    purchasePackage: jest.fn(async () => ({ customerInfo: proInfo(true) })),
    restorePurchases: jest.fn(async () => proInfo(true)),
    addCustomerInfoUpdateListener: jest.fn(),
    ...overrides,
  };
}

describe('purchases 純粋ロジック', () => {
  it('APIキーは空・空白を無し、値があれば返す', () => {
    expect(getApiKey({ EXPO_PUBLIC_REVENUECAT_IOS_KEY: '  ' }, 'ios')).toBeNull();
    expect(getApiKey({ EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_test' }, 'ios')).toBe('appl_test');
    expect(getApiKey({ EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: 'goog_test' }, 'android')).toBe('goog_test');
  });

  it('Entitlement pro の有無で判定する', () => {
    expect(isProFromCustomerInfo(proInfo(true))).toBe(true);
    expect(isProFromCustomerInfo(proInfo(false))).toBe(false);
    expect(isProFromCustomerInfo(null)).toBe(false);
  });

  it('商品は lifetime → 商品ID → 先頭の順で選ぶ', () => {
    const lifetime = pkg('¥900');
    expect(selectProPackage(offerings([pkg()], lifetime))).toEqual(lifetime);
    expect(selectProPackage(offerings([pkg()]))?.product.identifier).toBe(PRO_PRODUCT_ID);
    expect(selectProPackage({ current: { lifetime: null, availablePackages: [] } })).toBeNull();
    expect(selectProPackage(null)).toBeNull();
  });

  it('無料はカテゴリ1つまで', () => {
    expect(canAddCategory(false, 0)).toBe(true);
    expect(canAddCategory(false, FREE_CATEGORY_LIMIT)).toBe(false);
    expect(canAddCategory(true, 5)).toBe(true);
  });

  it('openedFrom を正規化する', () => {
    expect(parseOpenedFrom('csv')).toBe('csv');
    expect(parseOpenedFrom(['history'])).toBe('history');
    expect(parseOpenedFrom('unknown')).toBe('settings');
    expect(parseOpenedFrom(undefined)).toBe('settings');
  });

  it('購入キャンセルを判定する', () => {
    expect(isPurchaseCancelled({ userCancelled: true })).toBe(true);
    expect(isPurchaseCancelled({ code: '1' })).toBe(true);
    expect(isPurchaseCancelled({ code: 'PURCHASE_CANCELLED_ERROR' })).toBe(true);
    expect(isPurchaseCancelled(new Error('fail'))).toBe(false);
  });

  it('購入後の遷移先', () => {
    expect(destinationAfterPurchase('history')).toBe('/history');
    expect(destinationAfterPurchase('csv')).toBe('/export');
    expect(destinationAfterPurchase('settings')).toBeNull();
  });
});

describe('purchases ストア', () => {
  beforeEach(() => {
    resetPurchasesForTests();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    resetPurchasesForTests();
    jest.restoreAllMocks();
  });

  it('通常：初期化で Pro と価格を載せる', async () => {
    const client = mockClient({
      getCustomerInfo: jest.fn(async () => proInfo(true)),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    await initPurchases();

    const state = usePurchasesStore.getState();
    expect(state.isPro).toBe(true);
    expect(state.ready).toBe(true);
    expect(state.available).toBe(true);
    expect(state.priceString).toBe('¥800');
    expect(state.offeringsEmpty).toBe(false);
  });

  it('キーがあるときだけ configure する', async () => {
    const previous = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'appl_test';
    const client = mockClient();
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    await initPurchases();
    expect(client.configure).toHaveBeenCalledWith({ apiKey: 'appl_test' });

    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = previous;
  });

  it('空データ：提供が無いときは購入できない', async () => {
    const client = mockClient({
      getOfferings: jest.fn(async () => ({ current: { lifetime: null, availablePackages: [] } })),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    await initPurchases();
    const result = await purchasePro();

    expect(usePurchasesStore.getState().offeringsEmpty).toBe(true);
    expect(usePurchasesStore.getState().offeringsError).toBe(NO_OFFERINGS_MESSAGE);
    expect(result).toEqual({ ok: false, reason: 'empty', message: NO_OFFERINGS_MESSAGE });
    expect(client.purchasePackage).not.toHaveBeenCalled();
  });

  it('エラー：購入失敗は日本語で返す', async () => {
    const client = mockClient({
      purchasePackage: jest.fn(async () => {
        throw new Error('store down');
      }),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    await expect(purchasePro()).resolves.toEqual({
      ok: false,
      reason: 'error',
      message: PURCHASE_FAILED_MESSAGE,
    });
    expect(usePurchasesStore.getState().isPro).toBe(false);
    expect(usePurchasesStore.getState().purchaseInFlight).toBe(false);
  });

  it('キャンセルはエラーにしない', async () => {
    const client = mockClient({
      purchasePackage: jest.fn(async () => {
        throw { userCancelled: true, code: '1' };
      }),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    await expect(purchasePro()).resolves.toEqual({ ok: false, reason: 'cancelled' });
  });

  it('連打しても購入は1回。2回目以降は busy', async () => {
    const gate = deferred<{ customerInfo: CustomerInfoLike }>();
    const client = mockClient({
      purchasePackage: jest.fn(() => gate.promise),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    const first = purchasePro();
    const extras = await Promise.all([purchasePro(), purchasePro()]);

    expect(usePurchasesStore.getState().purchaseInFlight).toBe(true);
    expect(extras.every((r) => r.ok === false && r.reason === 'busy')).toBe(true);
    expect(client.purchasePackage).toHaveBeenCalledTimes(1);

    gate.resolve({ customerInfo: proInfo(true) });
    await expect(first).resolves.toEqual({ ok: true, isPro: true });
    expect(usePurchasesStore.getState().isPro).toBe(true);
    expect(usePurchasesStore.getState().purchaseInFlight).toBe(false);
  });

  it('未導入・キーなしでは購入も復元も unavailable', async () => {
    await initPurchases();
    expect(inspectPurchasesAvailability().available).toBe(false);

    await expect(purchasePro()).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      message: DEV_BUILD_ONLY_MESSAGE,
    });
    await expect(restorePurchases()).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      message: DEV_BUILD_ONLY_MESSAGE,
    });
    expect(usePurchasesStore.getState().isPro).toBe(false);
    expect(usePurchasesStore.getState().ready).toBe(true);
  });

  it('通常：復元で Pro になる / 購入が無い', async () => {
    const client = mockClient({
      restorePurchases: jest.fn(async () => proInfo(true)),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    await expect(restorePurchases()).resolves.toEqual({ ok: true, isPro: true });
    expect(usePurchasesStore.getState().isPro).toBe(true);

    const none = mockClient({
      restorePurchases: jest.fn(async () => proInfo(false)),
    });
    resetPurchasesForTests();
    setPurchasesClientForTests(none);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();
    await expect(restorePurchases()).resolves.toEqual({ ok: true, isPro: false });
  });

  it('復元失敗は日本語', async () => {
    const client = mockClient({
      restorePurchases: jest.fn(async () => {
        throw 'boom';
      }),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    await expect(restorePurchases()).resolves.toEqual({
      ok: false,
      reason: 'error',
      message: RESTORE_FAILED_MESSAGE,
    });
  });

  it('提供の取得失敗でも起動は壊れない', async () => {
    const client = mockClient({
      getOfferings: jest.fn(async () => {
        throw new Error('network');
      }),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    await initPurchases();
    expect(usePurchasesStore.getState().ready).toBe(true);
    expect(usePurchasesStore.getState().offeringsEmpty).toBe(true);
    expect(usePurchasesStore.getState().isPro).toBe(false);
  });

  it('未購入なら購入画面を開き、Proなら開かない', () => {
    expect(requireProOrOpenPaywall('history')).toBe(false);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { openedFrom: 'history' } });

    (router.push as jest.Mock).mockClear();
    usePurchasesStore.setState({ isPro: true });
    expect(requireProOrOpenPaywall('history')).toBe(true);
    expect(router.push).not.toHaveBeenCalled();

    openPaywall('csv');
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { openedFrom: 'csv' } });
  });
});
