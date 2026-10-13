import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { resetPurchasesForTests, usePurchasesStore } from '@/lib/purchases';

import { Toolbar } from '../components/Toolbar';

jest.mock('@/features/counters/store', () => {
  const state = { categoryId: 'cat-1', load: jest.fn(async () => {}) };
  return {
    useCountersStore: (selector: (s: typeof state) => unknown) => selector(state),
  };
});

describe('Toolbar Pro gate', () => {
  beforeEach(() => {
    resetPurchasesForTests();
    (router.push as jest.Mock).mockClear();
  });

  afterEach(() => {
    resetPurchasesForTests();
  });

  it('通常：未購入は購入画面、Proは機能へ', async () => {
    usePurchasesStore.setState({ isPro: false });
    const view = await render(<Toolbar />);
    fireEvent.press(view.getByTestId('toolbar-history'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { openedFrom: 'history' } });
    (router.push as jest.Mock).mockClear();
    fireEvent.press(view.getByTestId('toolbar-export'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { openedFrom: 'csv' } });
    expect(view.getByTestId('toolbar-sort')).toBeTruthy();

    (router.push as jest.Mock).mockClear();
    usePurchasesStore.setState({ isPro: true });
    await view.rerender(<Toolbar />);
    fireEvent.press(view.getByTestId('toolbar-history'));
    expect(router.push).toHaveBeenCalledWith('/history');
    (router.push as jest.Mock).mockClear();
    fireEvent.press(view.getByTestId('toolbar-export'));
    expect(router.push).toHaveBeenCalledWith('/export');
    expect(view.queryByText('PRO')).toBeNull();
    await view.unmount();
  });
});
