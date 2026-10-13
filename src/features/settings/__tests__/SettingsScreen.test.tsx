import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import SettingsScreen from '@/app/settings';

import { resetPurchasesForTests, usePurchasesStore } from '@/lib/purchases';

import {
  REVIEW_UNAVAILABLE_MESSAGE,
  resetSettingsActionLocksForTests,
  setRestorePurchasesImplForTests,
} from '../actions';
import { resetSettingsWriteQueueForTests, useSettingsStore } from '../store';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    canGoBack: () => true,
    back: jest.fn(),
    replace: jest.fn(),
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
  Stack: { Screen: () => null },
  useNavigation: () => ({ canGoBack: () => true, goBack: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../components/SettingsHeader', () => ({
  SettingsHeader: function MockSettingsHeader() {
    return null;
  },
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    resetSettingsActionLocksForTests();
    setRestorePurchasesImplForTests(null);
    resetSettingsWriteQueueForTests();
    resetPurchasesForTests();
    useSettingsStore.setState({
      haptics: true,
      keepAwake: true,
      error: null,
    });
    usePurchasesStore.setState({ isPro: false, priceString: null });
    mockRouterPush.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
    cleanup();
    resetPurchasesForTests();
    resetSettingsActionLocksForTests();
    jest.restoreAllMocks();
  });

  it('通常：項目・バージョン・トグルが見える', async () => {
    const { getByTestId, queryByText } = await render(<SettingsScreen />);
    expect(getByTestId('settings-toggle-haptics')).toBeTruthy();
    expect(getByTestId('settings-toggle-keep-awake')).toBeTruthy();
    expect(queryByText('タップ音')).toBeNull();
    expect(getByTestId('settings-restore')).toBeTruthy();
    expect(getByTestId('settings-review')).toBeTruthy();
    expect(getByTestId('settings-contact')).toBeTruthy();
    expect(getByTestId('settings-terms')).toBeTruthy();
    expect(getByTestId('settings-privacy')).toBeTruthy();
    expect(getByTestId('settings-version').props.children).toBe('カウンター＋ バージョン 1.0.0');
    expect(getByTestId('settings-pro-banner')).toBeTruthy();
    expect(queryByText('設定を保存できませんでした')).toBeNull();
  });

  it('連打：トグルは最後の値になり、復元は1回だけ動く', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('settings-toggle-haptics'));
    });
    expect(useSettingsStore.getState().haptics).toBe(false);

    const keepAwake = getByTestId('settings-toggle-keep-awake');
    await act(async () => {
      fireEvent.press(keepAwake);
      fireEvent.press(keepAwake);
      fireEvent.press(keepAwake);
    });
    expect(useSettingsStore.getState().keepAwake).toBe(false);

    await act(async () => {
      fireEvent.press(getByTestId('settings-restore'));
      fireEvent.press(getByTestId('settings-restore'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('購入を復元できません', '開発ビルドでのみ利用できます');
    });
  });

  it('連打：規約はアプリ内画面へ1回だけ進む', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('settings-privacy'));
      fireEvent.press(getByTestId('settings-privacy'));
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/legal/privacy');
    expect(mockRouterPush).toHaveBeenCalledTimes(1);

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.press(getByTestId('settings-terms'));
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/legal/terms');
  });

  it('空：レビューIDが無いと設定不足の案内を出す', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('settings-review'));
    });
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('開けません', REVIEW_UNAVAILABLE_MESSAGE);
    });
  });

  it('復元キャンセルはアラートを出さない', async () => {
    setRestorePurchasesImplForTests(async () => ({ ok: false, reason: 'cancelled' }));
    const { getByTestId } = await render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('settings-restore'));
    });
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('Pro なら案内バナーを出さない', async () => {
    usePurchasesStore.setState({ isPro: true });
    const { queryByTestId } = await render(<SettingsScreen />);
    expect(queryByTestId('settings-pro-banner')).toBeNull();
  });

  it('保存失敗の error を日本語で出す', async () => {
    useSettingsStore.setState({ error: '設定を保存できませんでした' });
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('settings-error').props.children).toBe('設定を保存できませんでした');
  });
});
