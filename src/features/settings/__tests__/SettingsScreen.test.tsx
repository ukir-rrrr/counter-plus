import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import SettingsScreen from '@/app/settings';

import { resetSettingsActionLocksForTests } from '../actions';
import { resetSettingsWriteQueueForTests, useSettingsStore } from '../store';

jest.mock('expo-router', () => ({
  router: { canGoBack: () => true, back: jest.fn(), replace: jest.fn(), push: jest.fn() },
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
    resetSettingsWriteQueueForTests();
    useSettingsStore.setState({
      haptics: true,
      keepAwake: true,
      error: null,
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('通常・空・連打：項目・バージョン・トグル・準備中アラート', async () => {
    const { getByTestId, queryByText, unmount } = await render(<SettingsScreen />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId('settings-toggle-haptics')).toBeTruthy();
    expect(getByTestId('settings-toggle-keep-awake')).toBeTruthy();
    expect(queryByText('タップ音')).toBeNull();
    expect(getByTestId('settings-restore')).toBeTruthy();
    expect(getByTestId('settings-review')).toBeTruthy();
    expect(getByTestId('settings-contact')).toBeTruthy();
    expect(getByTestId('settings-terms')).toBeTruthy();
    expect(getByTestId('settings-privacy')).toBeTruthy();
    expect(getByTestId('settings-version').props.children).toBe('カウンター＋ バージョン 1.0.0');
    expect(queryByText(/Proにする/)).toBeNull();
    expect(queryByText('設定を保存できませんでした')).toBeNull();

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
      expect(Alert.alert).toHaveBeenCalledWith('準備中', '購入の復元は、準備ができてから使えます。');
    });

    fireEvent.press(getByTestId('settings-privacy'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('準備中', 'この機能は準備中です。');
    });

    await unmount();
  });

  it('保存失敗の error を日本語で出す', async () => {
    useSettingsStore.setState({ error: '設定を保存できませんでした' });
    const { getByTestId, unmount } = await render(<SettingsScreen />);
    expect(getByTestId('settings-error').props.children).toBe('設定を保存できませんでした');
    await unmount();
  });
});
