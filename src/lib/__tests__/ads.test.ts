import { resetPurchasesForTests, usePurchasesStore } from '@/lib/purchases';

import { withPublicEnv } from './withPublicEnv';
import {
  ATT_AFTER_HOME_MS,
  bannerRequestOptions,
  getBannerUnitId,
  initAds,
  inspectAdsAvailability,
  prepareHomeAds,
  requestTrackingIfNeeded,
  resetAdsForTests,
  setAdsAvailabilityForTests,
  setAdsDelayForTests,
  setAdsSdkForTests,
  setTrackingClientForTests,
  GOOGLE_SAMPLE_AD_PUBLISHER,
  isGoogleSampleAdId,
  useAdsStore,
  type AdsSdkClient,
  type TrackingClient,
} from '../ads';

function mockSdk(overrides: Partial<AdsSdkClient> = {}): AdsSdkClient {
  return {
    initialize: jest.fn(async () => {}),
    setRequestConfiguration: jest.fn(async () => {}),
    ...overrides,
  };
}

function mockTracking(overrides: Partial<TrackingClient> = {}): TrackingClient {
  return {
    isAvailable: () => true,
    requestTrackingPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
    ...overrides,
  };
}

describe('ads 純粋ロジック', () => {
  it('開発中はテストID、本番は環境変数。空・空白・サンプルIDは無し', () => {
    expect(getBannerUnitId('ios', true)).toBe(`ca-app-pub-${GOOGLE_SAMPLE_AD_PUBLISHER}/2435281174`);
    expect(getBannerUnitId('android', true)).toBe(
      `ca-app-pub-${GOOGLE_SAMPLE_AD_PUBLISHER}/9214589741`,
    );
    withPublicEnv({ EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID: '  ' }, () => {
      expect(getBannerUnitId('ios', false)).toBeNull();
    });
    withPublicEnv({ EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID: 'ca-app-pub-1/2' }, () => {
      expect(getBannerUnitId('ios', false)).toBe('ca-app-pub-1/2');
    });
    withPublicEnv({ EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID: 'ca-app-pub-3/4' }, () => {
      expect(getBannerUnitId('android', false)).toBe('ca-app-pub-3/4');
    });
    withPublicEnv(
      { EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID: `ca-app-pub-${GOOGLE_SAMPLE_AD_PUBLISHER}/2435281174` },
      () => {
        expect(getBannerUnitId('ios', false)).toBeNull();
      },
    );
    expect(isGoogleSampleAdId(`ca-app-pub-${GOOGLE_SAMPLE_AD_PUBLISHER}~1`)).toBe(true);
    expect(isGoogleSampleAdId('ca-app-pub-1/2')).toBe(false);
  });

  it('拒否なら非パーソナライズ広告にする', () => {
    expect(bannerRequestOptions(false)).toEqual({ requestNonPersonalizedAdsOnly: true });
    expect(bannerRequestOptions(true)).toEqual({ requestNonPersonalizedAdsOnly: false });
  });
});

describe('ads ストア', () => {
  beforeEach(() => {
    resetAdsForTests();
    resetPurchasesForTests();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    resetAdsForTests();
    resetPurchasesForTests();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('通常：ATT許可のあとSDKを初期化する', async () => {
    const sdk = mockSdk();
    setAdsSdkForTests(sdk);
    setAdsAvailabilityForTests({ available: true });
    setTrackingClientForTests(mockTracking());

    await initAds(true);

    expect(sdk.initialize).toHaveBeenCalledTimes(1);
    expect(sdk.setRequestConfiguration).toHaveBeenCalledWith({
      publisherPrivacyPersonalizationState: 'enabled',
    });
    expect(useAdsStore.getState().initialized).toBe(true);
    expect(useAdsStore.getState().trackingGranted).toBe(true);
    expect(useAdsStore.getState().unitId).toBe(`ca-app-pub-${GOOGLE_SAMPLE_AD_PUBLISHER}/2435281174`);
  });

  it('空・キー無しでは初期化しない', async () => {
    const sdk = mockSdk();
    setAdsSdkForTests(sdk);
    setAdsAvailabilityForTests({ available: false, reason: 'no_key' });

    await initAds(false);

    expect(sdk.initialize).not.toHaveBeenCalled();
    expect(useAdsStore.getState().available).toBe(false);
    expect(useAdsStore.getState().unavailableReason).toBe('no_key');
    expect(inspectAdsAvailability()).toEqual({ available: false, reason: 'no_key' });
  });

  it('Expo Go では広告を出さない', async () => {
    setAdsAvailabilityForTests({ available: false, reason: 'expo_go' });
    await initAds(false);
    expect(useAdsStore.getState().initialized).toBe(false);
    expect(useAdsStore.getState().unavailableReason).toBe('expo_go');
  });

  it('初期化エラーでもアプリは止めない', async () => {
    const sdk = mockSdk({
      initialize: jest.fn(async () => {
        throw new Error('native boom');
      }),
    });
    setAdsSdkForTests(sdk);
    setAdsAvailabilityForTests({ available: true });

    await expect(initAds(false)).resolves.toBeUndefined();
    expect(useAdsStore.getState().initialized).toBe(false);
    expect(useAdsStore.getState().unavailableReason).toBe('no_native');
  });

  it('ATT 失敗・拒否は非パーソナライズとして扱う', async () => {
    setTrackingClientForTests(
      mockTracking({
        requestTrackingPermissionsAsync: jest.fn(async () => {
          throw new Error('att failed');
        }),
      }),
    );
    await expect(requestTrackingIfNeeded()).resolves.toBe(false);

    setTrackingClientForTests(
      mockTracking({
        requestTrackingPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'denied' })),
      }),
    );
    await expect(requestTrackingIfNeeded()).resolves.toBe(false);
  });

  it('ホーム準備は遅延後に1回だけ ATT する（連打しても）', async () => {
    const tracking = mockTracking();
    const sdk = mockSdk();
    setTrackingClientForTests(tracking);
    setAdsSdkForTests(sdk);
    setAdsAvailabilityForTests({ available: true });
    setAdsDelayForTests(async () => {});

    await Promise.all([prepareHomeAds(), prepareHomeAds(), prepareHomeAds()]);

    expect(tracking.requestTrackingPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(sdk.initialize).toHaveBeenCalledTimes(1);
  });

  it('Pro なら ATT も広告初期化もしない', async () => {
    const tracking = mockTracking();
    const sdk = mockSdk();
    setTrackingClientForTests(tracking);
    setAdsSdkForTests(sdk);
    setAdsAvailabilityForTests({ available: true });
    setAdsDelayForTests(async () => {});
    usePurchasesStore.setState({ isPro: true });

    await prepareHomeAds();

    expect(tracking.requestTrackingPermissionsAsync).not.toHaveBeenCalled();
    expect(sdk.initialize).not.toHaveBeenCalled();
    expect(useAdsStore.getState().initialized).toBe(false);
  });

  it('ATT はホーム待ちのあとで出す', async () => {
    jest.useFakeTimers();
    const tracking = mockTracking();
    const sdk = mockSdk();
    setTrackingClientForTests(tracking);
    setAdsSdkForTests(sdk);
    setAdsAvailabilityForTests({ available: true });

    const pending = prepareHomeAds();
    expect(tracking.requestTrackingPermissionsAsync).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(ATT_AFTER_HOME_MS);
    await pending;

    expect(tracking.requestTrackingPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(sdk.initialize).toHaveBeenCalledTimes(1);
  });
});
