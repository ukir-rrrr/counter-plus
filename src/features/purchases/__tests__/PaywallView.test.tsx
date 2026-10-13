import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  DEV_BUILD_ONLY_MESSAGE,
  initPurchases,
  NO_OFFERINGS_MESSAGE,
  PRO_ENTITLEMENT_ID,
  resetPurchasesForTests,
  setPurchasesAvailabilityForTests,
  setPurchasesClientForTests,
  usePurchasesStore,
  type CustomerInfoLike,
  type PurchasesClient,
} from '@/lib/purchases';

import { PaywallView } from '../components/PaywallView';

jest.mock('expo-router', () => ({
  router: { canGoBack: () => true, back: jest.fn(), replace: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ openedFrom: 'csv' }),
  useNavigation: () => ({ canGoBack: () => true, goBack: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/features/history/repository', () => ({
  countHistoryEvents: jest.fn(() => 128),
}));

function proInfo(isPro: boolean): CustomerInfoLike {
  return {
    entitlements: {
      active: isPro ? { [PRO_ENTITLEMENT_ID]: { identifier: PRO_ENTITLEMENT_ID } } : {},
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function mockClient(overrides: Partial<PurchasesClient> = {}): PurchasesClient {
  return {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getCustomerInfo: jest.fn(async () => proInfo(false)),
    getOfferings: jest.fn(async () => ({
      current: {
        lifetime: { identifier: 'pro_lifetime', product: { identifier: 'pro_lifetime', priceString: '¥800' } },
        availablePackages: [],
      },
    })),
    purchasePackage: jest.fn(async () => ({ customerInfo: proInfo(true) })),
    restorePurchases: jest.fn(async () => proInfo(true)),
    addCustomerInfoUpdateListener: jest.fn(),
    ...overrides,
  };
}

describe('PaywallView', () => {
  beforeEach(() => {
    resetPurchasesForTests();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    resetPurchasesForTests();
    jest.restoreAllMocks();
  });

  it('通常：特典の強調・履歴件数・価格・購入', async () => {
    const client = mockClient();
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    const { getByTestId, queryByTestId, unmount } = await render(<PaywallView openedFrom="csv" />);

    expect(getByTestId('paywall-title').props.children).toBe('カウンター＋ Pro');
    expect(getByTestId('paywall-history-count').props.children).toBe(128);
    expect(getByTestId('paywall-price').props.children).toBe('¥800');
    expect(getByTestId('paywall-benefit-csv')).toBeTruthy();
    expect(queryByTestId('paywall-purchased')).toBeNull();

    await act(async () => {
      fireEvent.press(getByTestId('paywall-buy'));
    });
    await waitFor(() => {
      expect(usePurchasesStore.getState().isPro).toBe(true);
      expect(getByTestId('paywall-purchased')).toBeTruthy();
      expect(getByTestId('paywall-start')).toBeTruthy();
    });

    await unmount();
  });

  it('空データ：商品が無いと購入ボタンは押せない', async () => {
    const client = mockClient({
      getOfferings: jest.fn(async () => ({ current: { lifetime: null, availablePackages: [] } })),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    const { getByTestId, unmount } = await render(<PaywallView openedFrom="history" />);
    expect(getByTestId('paywall-empty').props.children).toBe(NO_OFFERINGS_MESSAGE);
    expect(getByTestId('paywall-buy').props.accessibilityState).toMatchObject({ disabled: true });

    await act(async () => {
      fireEvent.press(getByTestId('paywall-buy'));
    });
    expect(client.purchasePackage).not.toHaveBeenCalled();
    await unmount();
  });

  it('エラー：購入失敗でアラート', async () => {
    const client = mockClient({
      purchasePackage: jest.fn(async () => {
        throw new Error('fail');
      }),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    const { getByTestId, unmount } = await render(<PaywallView openedFrom="sort" />);
    await act(async () => {
      fireEvent.press(getByTestId('paywall-buy'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('購入できません', expect.any(String));
    });
    await unmount();
  });

  it('未導入：開発ビルドの案内を出し、連打しても購入は1回', async () => {
    await initPurchases();
    const { getByTestId, unmount } = await render(<PaywallView openedFrom="settings" />);
    expect(getByTestId('paywall-unavailable').props.children).toBe(DEV_BUILD_ONLY_MESSAGE);

    await act(async () => {
      fireEvent.press(getByTestId('paywall-buy'));
      fireEvent.press(getByTestId('paywall-restore'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
    await unmount();
  });

  it('連打：購入中の2回目は無視する', async () => {
    const gate = deferred<{ customerInfo: CustomerInfoLike }>();
    const client = mockClient({
      purchasePackage: jest.fn(() => gate.promise),
    });
    setPurchasesClientForTests(client);
    setPurchasesAvailabilityForTests({ available: true });
    await initPurchases();

    const { getByTestId, unmount } = await render(<PaywallView openedFrom="ads" />);
    await act(async () => {
      fireEvent.press(getByTestId('paywall-buy'));
      fireEvent.press(getByTestId('paywall-buy'));
      fireEvent.press(getByTestId('paywall-buy'));
    });
    expect(client.purchasePackage).toHaveBeenCalledTimes(1);

    await act(async () => {
      gate.resolve({ customerInfo: proInfo(true) });
    });
    await waitFor(() => {
      expect(getByTestId('paywall-start')).toBeTruthy();
    });
    await unmount();
  });
});
