import { render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

import {
  HomeBannerAd,
  resetAdsForTests,
  setBannerAdComponentForTests,
  useAdsStore,
} from '@/lib/ads';
import { resetPurchasesForTests, usePurchasesStore } from '@/lib/purchases';

function OkBanner() {
  return <View testID="ok-banner" />;
}

function FailBanner({ onAdFailedToLoad }: { onAdFailedToLoad?: (error: unknown) => void }) {
  useEffect(() => {
    onAdFailedToLoad?.(new Error('no fill'));
  }, [onAdFailedToLoad]);
  return <View testID="fail-banner" />;
}

describe('HomeBannerAd 表示', () => {
  beforeEach(() => {
    resetAdsForTests();
    resetPurchasesForTests();
    setBannerAdComponentForTests(OkBanner);
  });

  afterEach(() => {
    resetAdsForTests();
    resetPurchasesForTests();
  });

  it('通常：無料なら広告枠の testID がある', async () => {
    usePurchasesStore.setState({ isPro: false });
    useAdsStore.setState({
      initialized: true,
      available: true,
      unitId: 'ca-app-pub-test/banner',
    });
    const { getByTestId, unmount } = await render(<HomeBannerAd />);
    expect(getByTestId('home-banner-ad')).toBeTruthy();
    expect(getByTestId('ok-banner')).toBeTruthy();
    await unmount();
  });

  it('Pro なら広告枠を出さない', async () => {
    usePurchasesStore.setState({ isPro: true });
    useAdsStore.setState({
      initialized: true,
      available: true,
      unitId: 'ca-app-pub-test/banner',
    });
    const { queryByTestId, unmount } = await render(<HomeBannerAd />);
    expect(queryByTestId('home-banner-ad')).toBeNull();
    expect(queryByTestId('ad-placeholder')).toBeNull();
    await unmount();
  });

  it('未初期化・キー無しではバナーを出さない', async () => {
    usePurchasesStore.setState({ isPro: false });
    const { queryByTestId, unmount } = await render(<HomeBannerAd />);
    expect(queryByTestId('home-banner-ad')).toBeNull();
    await unmount();
  });

  it('読み込み失敗なら枠を消す', async () => {
    usePurchasesStore.setState({ isPro: false });
    useAdsStore.setState({
      initialized: true,
      available: true,
      unitId: 'ca-app-pub-test/banner',
    });
    setBannerAdComponentForTests(FailBanner);
    const { queryByTestId, unmount } = await render(<HomeBannerAd />);
    await waitFor(() => {
      expect(queryByTestId('home-banner-ad')).toBeNull();
    });
    await unmount();
  });
});
