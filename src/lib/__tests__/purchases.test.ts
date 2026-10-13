import { router } from 'expo-router';

import {
  canAddCategory,
  DEV_BUILD_ONLY_MESSAGE,
  destinationAfterPurchase,
  FREE_CATEGORY_LIMIT,
  getApiKey,
  getIsPro,
  initPurchases,
  inspectPurchasesAvailability,
  isProFromCustomerInfo,
  isPurchaseCancelled,
  messageForUnavailable,
  NO_OFFERINGS_MESSAGE,
  notifyPurchasesAppStateForTests,
  openPaywall,
  parseOpenedFrom,
  PRO_ENTITLEMENT_ID,
  PRO_PRODUCT_ID,
  PURCHASE_FAILED_MESSAGE,
  PURCHASE_NOT_CONFIGURED_MESSAGE,
  purchasePro,
  refreshPurchases,
  requireProOrOpenPaywall,
  resetPurchasesForTests,
  RESTORE_FAILED_MESSAGE,
  restorePurchases,
  selectProPackage,
  setEntitlementCacheForTests,
  setPurchasesAvailabilityForTests,
  setPurchasesClientForTests,
  usePurchasesStore,
  type CustomerInfoLike,
  type OfferingsLike,
  type PackageLike,
  type PurchasesClient,
} from '../purchases';
import { withPublicEnv } from './withPublicEnv';

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
    withPublicEnv({ EXPO_PUBLIC_REVENUECAT_IOS_KEY: '  ' }, () => {
      expect(getApiKey('ios')).toBeNull();
    });
    withPublicEnv({ EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_test' }, () => {
      expect(getApiKey('ios')).toBe('appl_test');
    });
    withPublicEnv({ EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: 'goog_test' }, () => {
      expect(getApiKey('android')).toBe('goog_test');
    });
  });

  it('getIsPro はストアの Pro を返す', () => {
    resetPurchasesForTests();
    expect(getIsPro()).toBe(false);
    usePurchasesStore.setState({ isPro: true });
    expect(getIsPro()).toBe(true);
    resetPurchasesForTests();
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
    (router.push as jest.Mock).mockClear();
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
    await withPublicEnv({ EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_test' }, async () => {
      const client = mockClient();
      setPurchasesClientForTests(client);
      setPurchasesAvailabilityForTests({ available: true });

      await initPurchases();
      expect(client.configure).toHaveBeenCalledWith({ apiKey: 'appl_test' });
    });
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

  it('未導入では購入も復元も開発ビルドの案内', async () => {
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

  it('キー未設定は別の案内にする', async () => {
    setPurchasesAvailabilityForTests({ available: false, reason: 'no_key' });
    await initPurchases();

    expect(messageForUnavailable('no_key')).toBe(PURCHASE_NOT_CONFIGURED_MESSAGE);
    await expect(purchasePro()).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      message: PURCHASE_NOT_CONFIGURED_MESSAGE,
    });
    await expect(restorePurchases()).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      message: PURCHASE_NOT_CONFIGURED_MESSAGE,
    });
  });

  it('利用不可の連打でも同じ案内で、状態は壊れない', async () => {
    setPurchasesAvailabilityForTests({ available: false, reason: 'no_key' });
    const extras = await Promise.all([purchasePro(), purchasePro(), restorePurchases()]);
    expect(extras.every((r) => r.ok === false && r.reason === 'unavailable')).toBe(true);
    expect(extras[0]).toEqual({
      ok: false,
      reason: 'unavailable',
      message: PURCHASE_NOT_CONFIGURED_MESSAGE,
    });
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

  it('未購入なら購入画面を開き、Proなら開かない', async () => {
    usePurchasesStore.setState({ ready: true, isPro: false });
    await expect(requireProOrOpenPaywall('history')).resolves.toBe(false);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { openedFrom: 'history' } });

    (router.push as jest.Mock).mockClear();
    usePurchasesStore.setState({ isPro: true });
    await expect(requireProOrOpenPaywall('history')).resolves.toBe(true);
    expect(router.push).not.toHaveBeenCalled();

    openPaywall('csv');
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { openedFrom: 'csv' } });
  });

  it('getCustomerInfo が失敗しても最後の Pro を落とさない', async () => {
    const writes: boolean[] = [];
    setEntitlementCacheForTests({
      read: () => true,
      write: (value) => writes.push(value),
    });
    const client = mockClient({
      getCustomerInfo: jest.fn(async () => {
        throw new Error('offline');
      }),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    await initPurchases();

    expect(usePurchasesStore.getState().isPro).toBe(true);
    expect(usePurchasesStore.getState().ready).toBe(true);
    expect(writes).toEqual([]);
  });

  it('通常：取得成功で Pro をキャッシュする', async () => {
    const writes: boolean[] = [];
    setEntitlementCacheForTests({
      read: () => null,
      write: (value) => writes.push(value),
    });
    const client = mockClient({
      getCustomerInfo: jest.fn(async () => proInfo(true)),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    await initPurchases();
    expect(usePurchasesStore.getState().isPro).toBe(true);
    expect(writes).toEqual([true]);
  });

  it('フォアグラウンド復帰で購入状態を再取得する', async () => {
    setEntitlementCacheForTests({
      read: () => true,
      write: () => {},
    });
    const getCustomerInfo = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(proInfo(true));
    const client = mockClient({ getCustomerInfo });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    await initPurchases();
    expect(usePurchasesStore.getState().isPro).toBe(true);

    notifyPurchasesAppStateForTests('active');
    await refreshPurchases();
    expect(getCustomerInfo).toHaveBeenCalledTimes(2);
  });

  it('制限操作の直前に失敗した取得を再試行する', async () => {
    const getCustomerInfo = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(proInfo(true));
    const client = mockClient({ getCustomerInfo });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    await initPurchases();
    expect(usePurchasesStore.getState().isPro).toBe(false);

    await expect(requireProOrOpenPaywall('sort')).resolves.toBe(true);
    expect(getCustomerInfo).toHaveBeenCalledTimes(2);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('未準備の Pro キャッシュでは購入画面を開かない', async () => {
    setEntitlementCacheForTests({
      read: () => true,
      write: () => {},
    });
    const gate = deferred<CustomerInfoLike>();
    const client = mockClient({
      getCustomerInfo: jest.fn(() => gate.promise),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    const init = initPurchases();
    await expect(requireProOrOpenPaywall('csv')).resolves.toBe(true);
    expect(router.push).not.toHaveBeenCalled();

    gate.resolve(proInfo(true));
    await init;
  });

  it('未準備でキャッシュが無いときは初期化を待ってから購入画面を開く', async () => {
    const gate = deferred<CustomerInfoLike>();
    const client = mockClient({
      getCustomerInfo: jest.fn(() => gate.promise),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });

    const init = initPurchases();
    const first = requireProOrOpenPaywall('history');
    const extra1 = requireProOrOpenPaywall('history');
    const extra2 = requireProOrOpenPaywall('csv');
    expect(router.push).not.toHaveBeenCalled();

    gate.resolve(proInfo(false));
    await init;
    await expect(first).resolves.toBe(false);
    await expect(Promise.all([extra1, extra2])).resolves.toEqual([false, false]);
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { openedFrom: 'history' } });
  });
});
