import {
  initPurchases,
  resetPurchasesForTests,
  setPurchasesAvailabilityForTests,
  setPurchasesClientForTests,
  type PurchasesClient,
} from '@/lib/purchases';

import {
  appStoreReviewUrl,
  contactMailtoUrl,
  CONTACT_UNAVAILABLE_MESSAGE,
  getSupportUrls,
  isRestoreInFlight,
  isSupportInFlight,
  openLegalScreen,
  openSupportLink,
  resetSettingsActionLocksForTests,
  restorePurchases,
  RESTORE_UNAVAILABLE_MESSAGE,
  REVIEW_UNAVAILABLE_MESSAGE,
  setRestorePurchasesImplForTests,
  type SupportOpener,
} from '../actions';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mockOpener(overrides: Partial<SupportOpener> = {}): SupportOpener {
  return {
    openExternal: jest.fn(async () => {}),
    openBrowser: jest.fn(async () => {}),
    ...overrides,
  };
}

function mockPurchasesClient(overrides: Partial<PurchasesClient> = {}): PurchasesClient {
  return {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {} } })),
    getOfferings: jest.fn(async () => ({ current: { lifetime: null, availablePackages: [] } })),
    purchasePackage: jest.fn(async () => ({ customerInfo: { entitlements: { active: {} } } })),
    restorePurchases: jest.fn(async () => ({ entitlements: { active: {} } })),
    addCustomerInfoUpdateListener: jest.fn(),
    ...overrides,
  };
}

describe('restorePurchases', () => {
  beforeEach(() => {
    resetSettingsActionLocksForTests();
    setRestorePurchasesImplForTests(null);
    resetPurchasesForTests();
  });

  afterEach(() => {
    resetPurchasesForTests();
  });

  it('通常：ネイティブ未導入では unavailable を返す', async () => {
    const result = await restorePurchases();
    expect(result).toEqual({
      ok: false,
      reason: 'unavailable',
      message: RESTORE_UNAVAILABLE_MESSAGE,
    });
  });

  it('復元処理の例外は error にする', async () => {
    setRestorePurchasesImplForTests(async () => {
      throw new Error('network');
    });
    const result = await restorePurchases();
    expect(result).toMatchObject({ ok: false, reason: 'error', message: 'network' });
  });

  it('Error 以外の例外も文言にする', async () => {
    setRestorePurchasesImplForTests(async () => {
      throw 'boom';
    });
    const result = await restorePurchases();
    expect(result).toMatchObject({ ok: false, reason: 'error', message: '購入を復元できませんでした' });
  });

  it('キャンセルは error にせず無音で返す', async () => {
    setPurchasesAvailabilityForTests({ available: true });
    setPurchasesClientForTests(
      mockPurchasesClient({
        restorePurchases: jest.fn(async () => {
          throw { userCancelled: true, code: '1' };
        }),
      }),
    );
    await initPurchases();

    const result = await restorePurchases();
    expect(result).toEqual({ ok: false, reason: 'cancelled' });
  });

  it('連打しても復元は1回。2回目以降は busy', async () => {
    const gate = deferred<void>();
    setRestorePurchasesImplForTests(async () => {
      await gate.promise;
      return { ok: true };
    });

    const first = restorePurchases();
    const extras = await Promise.all([restorePurchases(), restorePurchases()]);

    expect(isRestoreInFlight()).toBe(true);
    expect(extras.every((r) => r.ok === false && r.reason === 'busy')).toBe(true);

    gate.resolve();
    await expect(first).resolves.toEqual({ ok: true });
    expect(isRestoreInFlight()).toBe(false);
  });
});

describe('openSupportLink', () => {
  beforeEach(() => {
    resetSettingsActionLocksForTests();
  });

  it('通常：https はブラウザ、お問い合わせは外部アプリ', async () => {
    const opener = mockOpener();
    const urls = {
      review: 'https://apps.apple.com/app/id000',
      contact: 'mailto:support@example.com',
      terms: 'https://example.com/terms',
      privacy: 'https://example.com/privacy',
    };

    await expect(openSupportLink('review', opener, urls)).resolves.toEqual({ ok: true });
    expect(opener.openBrowser).toHaveBeenCalledWith(urls.review);

    await expect(openSupportLink('contact', opener, urls)).resolves.toEqual({ ok: true });
    expect(opener.openExternal).toHaveBeenCalledWith(urls.contact);
  });

  it('空データ：URLが空・空白なら unavailable', async () => {
    const opener = mockOpener();
    const empty = { review: '', contact: '   ', terms: '', privacy: '' };

    await expect(openSupportLink('review', opener, empty)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      message: REVIEW_UNAVAILABLE_MESSAGE,
    });
    await expect(openSupportLink('contact', opener, empty)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
      message: CONTACT_UNAVAILABLE_MESSAGE,
    });
    expect(opener.openBrowser).not.toHaveBeenCalled();
    expect(opener.openExternal).not.toHaveBeenCalled();
  });

  it('開けないときは error', async () => {
    const opener = mockOpener({
      openBrowser: jest.fn(async () => {
        throw new Error('no browser');
      }),
    });
    const result = await openSupportLink('terms', opener, {
      review: '',
      contact: '',
      terms: 'https://example.com/terms',
      privacy: '',
    });
    expect(result).toMatchObject({ ok: false, reason: 'error', message: 'no browser' });
  });

  it('連打してもリンクは1回。2回目以降は busy', async () => {
    const gate = deferred<void>();
    const opener = mockOpener({
      openBrowser: jest.fn(() => gate.promise),
    });
    const urls = {
      review: 'https://example.com/review',
      contact: '',
      terms: '',
      privacy: '',
    };

    const first = openSupportLink('review', opener, urls);
    const extras = await Promise.all([
      openSupportLink('review', opener, urls),
      openSupportLink('terms', opener, urls),
    ]);

    expect(isSupportInFlight()).toBe(true);
    expect(extras.every((r) => r.ok === false && r.reason === 'busy')).toBe(true);
    expect(opener.openBrowser).toHaveBeenCalledTimes(1);

    gate.resolve();
    await expect(first).resolves.toEqual({ ok: true });
    expect(isSupportInFlight()).toBe(false);
  });
});

describe('サポートURLの組み立て', () => {
  it('通常：数字の App Store ID とメールから URL を作る', () => {
    expect(appStoreReviewUrl('1234567890')).toBe(
      'https://apps.apple.com/app/id1234567890?action=write-review',
    );
    expect(contactMailtoUrl('hello@example.com')).toBe(
      'mailto:hello@example.com?subject=%E3%82%AB%E3%82%A6%E3%83%B3%E3%82%BF%E3%83%BC%EF%BC%8B%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E3%81%AE%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B',
    );
    expect(getSupportUrls({ EXPO_PUBLIC_APP_STORE_ID: '42', EXPO_PUBLIC_SUPPORT_EMAIL: 'a@b.c' })).toEqual({
      review: 'https://apps.apple.com/app/id42?action=write-review',
      contact: 'mailto:a@b.c?subject=%E3%82%AB%E3%82%A6%E3%83%B3%E3%82%BF%E3%83%BC%EF%BC%8B%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E3%81%AE%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B',
      terms: '',
      privacy: '',
    });
  });

  it('空・不正な値は URL にしない', () => {
    expect(appStoreReviewUrl('')).toBe('');
    expect(appStoreReviewUrl('  ')).toBe('');
    expect(appStoreReviewUrl('id123')).toBe('');
    expect(contactMailtoUrl('')).toBe('');
    expect(contactMailtoUrl('not-an-email')).toBe('');
    expect(contactMailtoUrl('a @b.c')).toBe('');
  });
});

describe('openLegalScreen', () => {
  beforeEach(() => {
    resetSettingsActionLocksForTests();
  });

  it('通常：利用規約とプライバシーのアプリ内画面へ進む', async () => {
    const navigate = jest.fn();
    expect(openLegalScreen('terms', navigate)).toEqual({ ok: true });
    expect(navigate).toHaveBeenCalledWith('/legal/terms');
    await Promise.resolve();
    expect(openLegalScreen('privacy', navigate)).toEqual({ ok: true });
    expect(navigate).toHaveBeenCalledWith('/legal/privacy');
  });

  it('エラー：navigate が投げたら error', () => {
    const navigate = jest.fn(() => {
      throw new Error('nav fail');
    });
    expect(openLegalScreen('terms', navigate)).toEqual({
      ok: false,
      reason: 'error',
      message: 'nav fail',
    });
  });

  it('連打：同時の2回目は busy で、遷移は1回', () => {
    const navigate = jest.fn();
    const first = openLegalScreen('terms', navigate);
    const extras = [openLegalScreen('terms', navigate), openLegalScreen('privacy', navigate)];
    expect(first).toEqual({ ok: true });
    expect(extras.every((r) => r.ok === false && r.reason === 'busy')).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
