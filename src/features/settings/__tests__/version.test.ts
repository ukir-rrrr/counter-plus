import { getAppVersion } from '../version';

describe('getAppVersion', () => {
  it('通常：設定されたバージョンを返す', () => {
    expect(getAppVersion('1.2.3')).toBe('1.2.3');
  });

  it('空データ：未設定・空白は 1.0.0', () => {
    expect(getAppVersion(undefined)).toBe('1.0.0');
    expect(getAppVersion(null)).toBe('1.0.0');
    expect(getAppVersion('')).toBe('1.0.0');
    expect(getAppVersion('   ')).toBe('1.0.0');
  });
});
