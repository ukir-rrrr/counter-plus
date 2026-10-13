import { render } from '@testing-library/react-native';

import { resetPurchasesForTests, usePurchasesStore } from '@/lib/purchases';

import { AdPlaceholder } from '../components/AdPlaceholder';

describe('AdPlaceholder', () => {
  afterEach(() => {
    resetPurchasesForTests();
  });

  it('無料なら広告枠を出す', async () => {
    resetPurchasesForTests();
    usePurchasesStore.setState({ isPro: false });
    const { getByTestId, unmount } = await render(<AdPlaceholder />);
    expect(getByTestId('ad-placeholder')).toBeTruthy();
    await unmount();
  });

  it('Pro なら広告枠を出さない', async () => {
    resetPurchasesForTests();
    usePurchasesStore.setState({ isPro: true });
    const { queryByTestId, unmount } = await render(<AdPlaceholder />);
    expect(queryByTestId('ad-placeholder')).toBeNull();
    await unmount();
  });
});
