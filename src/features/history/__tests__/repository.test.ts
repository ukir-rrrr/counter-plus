import { normalizeHistoryCount } from '../repository';

describe('normalizeHistoryCount', () => {
  it('通常：0以上の整数を返す', () => {
    expect(normalizeHistoryCount(128)).toBe(128);
    expect(normalizeHistoryCount(0)).toBe(0);
  });

  it('空・不正は 0', () => {
    expect(normalizeHistoryCount(null)).toBe(0);
    expect(normalizeHistoryCount(undefined)).toBe(0);
    expect(normalizeHistoryCount(-3)).toBe(0);
    expect(normalizeHistoryCount(Number.NaN)).toBe(0);
  });
});
