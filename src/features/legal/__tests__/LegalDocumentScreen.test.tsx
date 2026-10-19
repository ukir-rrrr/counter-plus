import { act, fireEvent, render } from '@testing-library/react-native';

import TermsScreen from '@/app/legal/terms';
import PrivacyScreen from '@/app/legal/privacy';

import { LegalDocumentScreen } from '../components/LegalDocumentScreen';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../content';

const mockGoBack = jest.fn();

jest.mock('expo-router', () => ({
  router: { canGoBack: () => true, back: jest.fn(), replace: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
  useNavigation: () => ({
    canGoBack: () => true,
    goBack: mockGoBack,
    addListener: () => () => {},
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('LegalDocumentScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it('通常：利用規約の見出しと本文が出る', async () => {
    const { getByTestId, unmount } = await render(
      <LegalDocumentScreen testIDPrefix="legal-terms" document={TERMS_OF_SERVICE} />,
    );
    expect(getByTestId('legal-terms-title').props.children).toBe('利用規約');
    expect(getByTestId('legal-terms-intro').props.children).toContain('カウンター＋');
    expect(getByTestId('legal-terms-section-0')).toBeTruthy();
    expect(getByTestId('legal-terms-updated').props.children).toContain('2026');
    await unmount();
  });

  it('空に近い文書でも落ちない', async () => {
    const { getByTestId, queryByTestId, unmount } = await render(
      <LegalDocumentScreen
        testIDPrefix="legal-empty"
        document={{
          id: 'terms',
          title: '空',
          updatedLabel: '',
          intro: '',
          sections: [],
        }}
      />,
    );
    expect(getByTestId('legal-empty-title').props.children).toBe('空');
    expect(queryByTestId('legal-empty-section-0')).toBeNull();
    await unmount();
  });

  it('連打：戻るは遷移ゲート経由で扱う', async () => {
    const { getByTestId, unmount } = await render(
      <LegalDocumentScreen testIDPrefix="legal-terms" document={TERMS_OF_SERVICE} />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('legal-terms-back'));
      fireEvent.press(getByTestId('legal-terms-back'));
      fireEvent.press(getByTestId('legal-terms-back'));
    });
    expect(getByTestId('legal-terms-back')).toBeTruthy();
    await unmount();
  });
});

describe('規約ルート', () => {
  it('利用規約・プライバシーの画面をそれぞれ出す', async () => {
    const terms = await render(<TermsScreen />);
    expect(terms.getByTestId('legal-terms-title').props.children).toBe(TERMS_OF_SERVICE.title);
    expect(terms.getByTestId('legal-terms-section-1')).toBeTruthy();
    terms.unmount();

    const privacy = await render(<PrivacyScreen />);
    expect(privacy.getByTestId('legal-privacy-title').props.children).toBe(PRIVACY_POLICY.title);
    expect(privacy.getByText('2. 広告（Google AdMob）')).toBeTruthy();
    privacy.unmount();
  });
});
