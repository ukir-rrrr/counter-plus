import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { resetPurchasesForTests, usePurchasesStore } from '@/lib/purchases';

import { ProBanner } from '../components/ProBanner';

describe('ProBanner', () => {
  beforeEach(() => {
    resetPurchasesForTests();
  });

  afterEach(() => {
    resetPurchasesForTests();
  });

  it('通常・空・Pro：案内の出し分けとタップ', async () => {
    usePurchasesStore.setState({ isPro: false, priceString: '¥800' });
    const view = await render(<ProBanner />);
    expect(view.getByTestId('settings-pro-banner').props.accessibilityLabel).toBe(
      'Proにする（買い切り ¥800）',
    );
    fireEvent.press(view.getByTestId('settings-pro-banner'));
    fireEvent.press(view.getByTestId('settings-pro-banner'));
    fireEvent.press(view.getByTestId('settings-pro-banner'));
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { openedFrom: 'settings' } });

    usePurchasesStore.setState({ priceString: null });
    await view.rerender(<ProBanner />);
    expect(view.getByTestId('settings-pro-banner').props.accessibilityLabel).toBe('Proにする（買い切り）');

    usePurchasesStore.setState({ isPro: true });
    await view.rerender(<ProBanner />);
    expect(view.queryByTestId('settings-pro-banner')).toBeNull();
    await view.unmount();
  });
});
