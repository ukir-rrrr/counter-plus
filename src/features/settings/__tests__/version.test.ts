import { getAppVersion, getGitCommitHash, UNKNOWN_GIT_HASH } from '../version';

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

describe('getGitCommitHash', () => {
  it('通常：7桁の小文字にする', () => {
    expect(getGitCommitHash('ABCDEF1234')).toBe('abcdef1');
  });

  it('空・不正は unknown で落とさない', () => {
    expect(getGitCommitHash(undefined)).toBe(UNKNOWN_GIT_HASH);
    expect(getGitCommitHash(null)).toBe(UNKNOWN_GIT_HASH);
    expect(getGitCommitHash('')).toBe(UNKNOWN_GIT_HASH);
    expect(getGitCommitHash('zzz')).toBe(UNKNOWN_GIT_HASH);
  });
});
