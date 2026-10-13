import { isBenefitHighlighted, PAYWALL_BENEFITS, paywallBenefitTestId } from '../benefits';

describe('paywall benefits', () => {
  it('openedFrom と一致する特典だけ強調する', () => {
    expect(isBenefitHighlighted('csv', 'csv')).toBe(true);
    expect(isBenefitHighlighted('history', 'csv')).toBe(false);
    expect(isBenefitHighlighted('csv', 'settings')).toBe(false);
  });

  it('特典は5つで testID が安定している', () => {
    expect(PAYWALL_BENEFITS).toHaveLength(5);
    expect(paywallBenefitTestId('csv')).toBe('paywall-benefit-csv');
    expect(PAYWALL_BENEFITS.map((b) => b.key)).toEqual(['csv', 'history', 'category', 'sort', 'ads']);
  });
});
