import {
  PAYWALL_FAB_CLEARANCE,
  PAYWALL_LARGE_TOP_INSET,
  PAYWALL_MIN_TOP_INSET,
  PAYWALL_SE_TOP_INSET,
  PAYWALL_TITLE_STYLE,
  paywallFooterBottom,
  paywallTopInset,
} from '../paywallLayout';

describe('paywallLayout', () => {
  it('タイトルは日本語グリフが切れない行高と上余白を持つ', () => {
    expect(PAYWALL_TITLE_STYLE.lineHeight).toBeGreaterThanOrEqual(PAYWALL_TITLE_STYLE.fontSize * 1.4);
    expect(PAYWALL_TITLE_STYLE.paddingTop).toBeGreaterThanOrEqual(4);
  });

  it('SE・大型・モーダルの safe area を潰さない', () => {
    expect(paywallTopInset(0)).toBe(PAYWALL_MIN_TOP_INSET);
    expect(paywallTopInset(PAYWALL_SE_TOP_INSET)).toBe(PAYWALL_SE_TOP_INSET);
    expect(paywallTopInset(PAYWALL_LARGE_TOP_INSET)).toBe(PAYWALL_LARGE_TOP_INSET);
    expect(paywallTopInset(Number.NaN)).toBe(PAYWALL_MIN_TOP_INSET);
  });

  it('開発中はフッターに歯車分の下余白を足す', () => {
    expect(paywallFooterBottom(0, false)).toBe(16);
    expect(paywallFooterBottom(34, false)).toBe(34);
    expect(paywallFooterBottom(34, true)).toBe(34 + PAYWALL_FAB_CLEARANCE);
    expect(paywallFooterBottom(0, true)).toBe(16 + PAYWALL_FAB_CLEARANCE);
  });
});
