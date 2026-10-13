import {
  isRestoreInFlight,
  isSupportInFlight,
  openSupportLink,
  resetSettingsActionLocksForTests,
  restorePurchases,
  RESTORE_UNAVAILABLE_MESSAGE,
  setRestorePurchasesImplForTests,
  UNAVAILABLE_MESSAGE,
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

describe('restorePurchases', () => {
  beforeEach(() => {
    resetSettingsActionLocksForTests();
    setRestorePurchasesImplForTests(null);
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
      message: UNAVAILABLE_MESSAGE,
    });
    await expect(openSupportLink('contact', opener, empty)).resolves.toMatchObject({
      ok: false,
      reason: 'unavailable',
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
