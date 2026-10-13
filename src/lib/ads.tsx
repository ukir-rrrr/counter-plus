import { createElement, useState, type ComponentType } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import { create } from 'zustand';

import { getIsPro, useIsPro } from '@/lib/purchases';

/** ホームが表示されてから ATT を出すまでの待ち時間。スプラッシュ中には出さない */
export const ATT_AFTER_HOME_MS = 1500;

/** Google 公式サンプル広告のパブリッシャー番号。本番ではこのIDを出さない */
export const GOOGLE_SAMPLE_AD_PUBLISHER = '3940256099942544';

export function isGoogleSampleAdId(id: string): boolean {
  return id.includes(GOOGLE_SAMPLE_AD_PUBLISHER);
}

export type UnavailableReason = 'no_native' | 'no_key' | 'expo_go';

export type AdsAvailability =
  | { available: true }
  | { available: false; reason: UnavailableReason };

export type TrackingPermission = {
  granted: boolean;
  status?: string;
};

export type TrackingClient = {
  isAvailable?: () => boolean;
  requestTrackingPermissionsAsync: () => Promise<TrackingPermission>;
};

export type AdsSdkClient = {
  initialize: () => Promise<unknown>;
  setRequestConfiguration?: (config: {
    publisherPrivacyPersonalizationState?: 'enabled' | 'disabled' | 'unset';
  }) => Promise<unknown> | unknown;
};

type BannerAdProps = {
  unitId: string;
  size: string;
  requestOptions?: { requestNonPersonalizedAdsOnly?: boolean };
  onAdFailedToLoad?: (error: unknown) => void;
};

type BannerAdComponent = ComponentType<BannerAdProps>;

type AdsState = {
  ready: boolean;
  available: boolean;
  unavailableReason: UnavailableReason | null;
  initialized: boolean;
  trackingGranted: boolean;
  unitId: string | null;
};

const initialState: AdsState = {
  ready: false,
  available: false,
  unavailableReason: null,
  initialized: false,
  trackingGranted: false,
  unitId: null,
};

export const useAdsStore = create<AdsState>(() => ({ ...initialState }));

let injectedSdk: AdsSdkClient | null = null;
let injectedTracking: TrackingClient | null = null;
let injectedBanner: BannerAdComponent | null = null;
let availabilityOverride: AdsAvailability | null = null;
let initPromise: Promise<void> | null = null;
let preparePromise: Promise<void> | null = null;
let delayImpl: (ms: number) => Promise<void> = defaultDelay;

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function hasNativeAdsModule(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NativeModules } = require('react-native') as {
      NativeModules: { RNGoogleMobileAdsModule?: unknown };
    };
    return NativeModules.RNGoogleMobileAdsModule != null;
  } catch {
    return false;
  }
}

function googleSampleBannerUnitId(os: string): string | null {
  // 文字列リテラルは __DEV__ 分岐の内側だけに置き、本番バンドルから除く
  if (__DEV__) {
    return os === 'android'
      ? `ca-app-pub-${GOOGLE_SAMPLE_AD_PUBLISHER}/9214589741`
      : `ca-app-pub-${GOOGLE_SAMPLE_AD_PUBLISHER}/2435281174`;
  }
  return null;
}

export function getBannerUnitId(
  os: string = Platform.OS,
  isDev: boolean = typeof __DEV__ !== 'undefined' ? __DEV__ : false,
): string | null {
  if (isDev) {
    return googleSampleBannerUnitId(os);
  }
  // Metro が本番バンドルで値を埋め込むので、process.env.EXPO_PUBLIC_* を直接書く
  const raw =
    os === 'ios'
      ? process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID
      : process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID;
  const id = raw?.trim() ?? '';
  if (id.length === 0) return null;
  if (isGoogleSampleAdId(id)) return null;
  return id;
}

export function inspectAdsAvailability(
  os: string = Platform.OS,
  isDev: boolean = typeof __DEV__ !== 'undefined' ? __DEV__ : true,
): AdsAvailability {
  if (availabilityOverride) return availabilityOverride;
  if (injectedSdk) return { available: true };
  if (isExpoGoEnv()) return { available: false, reason: 'expo_go' };
  if (!isNativeStorePlatform(os) || !hasNativeAdsModule()) {
    return { available: false, reason: 'no_native' };
  }
  if (!getBannerUnitId(os, isDev)) return { available: false, reason: 'no_key' };
  return { available: true };
}

function tryCreateAdsSdk(): AdsSdkClient | null {
  try {
    if (!hasNativeAdsModule()) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-google-mobile-ads') as {
      default?: () => AdsSdkClient;
      MobileAds?: () => AdsSdkClient;
    };
    const factory = mod.default ?? mod.MobileAds;
    if (typeof factory !== 'function') return null;
    return factory();
  } catch (e) {
    console.warn('広告SDKを読み込めませんでした', e);
    return null;
  }
}

function tryCreateTrackingClient(): TrackingClient | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tracking = require('expo-tracking-transparency') as TrackingClient;
    if (typeof Tracking.requestTrackingPermissionsAsync !== 'function') return null;
    return Tracking;
  } catch (e) {
    console.warn('追跡許可モジュールを読み込めませんでした', e);
    return null;
  }
}

function tryLoadBannerAd(): BannerAdComponent | null {
  if (injectedBanner) return injectedBanner;
  try {
    if (!hasNativeAdsModule()) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BannerAd } = require('react-native-google-mobile-ads') as { BannerAd?: BannerAdComponent };
    return BannerAd ?? null;
  } catch (e) {
    console.warn('バナー広告を読み込めませんでした', e);
    return null;
  }
}

function applyUnavailable(reason: UnavailableReason): void {
  useAdsStore.setState({
    ready: true,
    available: false,
    unavailableReason: reason,
    initialized: false,
    unitId: null,
  });
}

/**
 * ATT を1回だけ出す。未導入・失敗・拒否はすべて非パーソナライズとして扱う。
 * スプラッシュ中には呼ばない（ホーム表示後の prepareHomeAds から）。
 */
export async function requestTrackingIfNeeded(): Promise<boolean> {
  const client = injectedTracking ?? tryCreateTrackingClient();
  if (!client) return false;
  if (client.isAvailable && !client.isAvailable()) return false;
  try {
    const result = await client.requestTrackingPermissionsAsync();
    return Boolean(result.granted);
  } catch (e) {
    console.warn('追跡許可の確認に失敗しました', e);
    return false;
  }
}

export function bannerRequestOptions(trackingGranted: boolean): { requestNonPersonalizedAdsOnly: boolean } {
  return { requestNonPersonalizedAdsOnly: !trackingGranted };
}

async function runInitAds(trackingGranted: boolean): Promise<void> {
  const availability = inspectAdsAvailability();
  if (!availability.available) {
    applyUnavailable(availability.reason);
    return;
  }

  const unitId = getBannerUnitId();
  if (!unitId) {
    applyUnavailable('no_key');
    return;
  }

  const sdk = injectedSdk ?? tryCreateAdsSdk();
  if (!sdk) {
    applyUnavailable('no_native');
    return;
  }

  try {
    await sdk.setRequestConfiguration?.({
      publisherPrivacyPersonalizationState: trackingGranted ? 'enabled' : 'disabled',
    });
    await sdk.initialize();
    useAdsStore.setState({
      ready: true,
      available: true,
      unavailableReason: null,
      initialized: true,
      trackingGranted,
      unitId,
    });
  } catch (e) {
    console.warn('広告の初期化に失敗しました', e);
    applyUnavailable('no_native');
  }
}

/** 開発ビルドで広告SDKを初期化する。失敗してもアプリは止めない */
export async function initAds(trackingGranted = false): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = runInitAds(trackingGranted).finally(() => {
    // 失敗後にも再試行できるようにする
    if (!useAdsStore.getState().initialized) {
      initPromise = null;
    }
  });
  return initPromise;
}

async function runPrepareHomeAds(): Promise<void> {
  try {
    await delayImpl(ATT_AFTER_HOME_MS);

    if (getIsPro()) {
      useAdsStore.setState({ ready: true, available: false, initialized: false, unitId: null });
      return;
    }

    const availability = inspectAdsAvailability();
    if (!availability.available) {
      applyUnavailable(availability.reason);
      return;
    }

    const granted = await requestTrackingIfNeeded();
    await initAds(granted);
  } catch (e) {
    console.warn('広告の準備に失敗しました', e);
    applyUnavailable('no_native');
  }
}

/**
 * ホームが表示されたあとで ATT → 広告初期化。
 * 連打や再フォーカスでは1回だけ動く。
 */
export async function prepareHomeAds(): Promise<void> {
  if (preparePromise) return preparePromise;
  preparePromise = runPrepareHomeAds();
  return preparePromise;
}

const adSlotStyle: ViewStyle = { overflow: 'hidden' };

function OptionalBannerAd(props: BannerAdProps) {
  const Component = tryLoadBannerAd();
  if (!Component) return null;
  return createElement(Component, props);
}

/** ホーム最下部のアダプティブバナー。Pro・未準備・失敗時は何も出さない */
export function HomeBannerAd() {
  const isPro = useIsPro();
  const initialized = useAdsStore((s) => s.initialized);
  const available = useAdsStore((s) => s.available);
  const trackingGranted = useAdsStore((s) => s.trackingGranted);
  const unitId = useAdsStore((s) => s.unitId);
  const [failed, setFailed] = useState(false);

  if (isPro || !initialized || !available || !unitId || failed) return null;

  return (
    <View
      testID="home-banner-ad"
      accessibilityLabel="広告"
      className="border-t border-border bg-ad-bg pt-2"
      style={adSlotStyle}>
      <OptionalBannerAd
        unitId={unitId}
        size="LARGE_ANCHORED_ADAPTIVE_BANNER"
        requestOptions={bannerRequestOptions(trackingGranted)}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

/** テスト用。広告SDKを差し替える */
export function setAdsSdkForTests(client: AdsSdkClient | null): void {
  injectedSdk = client;
}

/** テスト用。ATT クライアントを差し替える */
export function setTrackingClientForTests(client: TrackingClient | null): void {
  injectedTracking = client;
}

/** テスト用。バナーコンポーネントを差し替える */
export function setBannerAdComponentForTests(component: BannerAdComponent | null): void {
  injectedBanner = component;
}

/** テスト用。利用可否判定を上書きする */
export function setAdsAvailabilityForTests(value: AdsAvailability | null): void {
  availabilityOverride = value;
}

/** テスト用。ATT 前の待ち時間を差し替える */
export function setAdsDelayForTests(delay: ((ms: number) => Promise<void>) | null): void {
  delayImpl = delay ?? defaultDelay;
}

/** テスト用。状態とロックを初期化する */
export function resetAdsForTests(): void {
  injectedSdk = null;
  injectedTracking = null;
  injectedBanner = null;
  availabilityOverride = null;
  initPromise = null;
  preparePromise = null;
  delayImpl = defaultDelay;
  useAdsStore.setState({ ...initialState });
}
