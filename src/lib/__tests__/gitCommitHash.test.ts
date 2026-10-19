declare function require(id: string): unknown;
declare const __dirname: string;

type NodePath = { join: (...parts: string[]) => string };

const { join } = require('path') as NodePath;

const { UNKNOWN_GIT_HASH, normalizeGitHash, readGitCommitHash } = require(
  join(__dirname, '../../../config/gitCommitHash.js'),
) as {
  UNKNOWN_GIT_HASH: string;
  normalizeGitHash: (raw: unknown) => string;
  readGitCommitHash: (
    env?: Record<string, string | undefined>,
    execSyncImpl?: (cmd: string, opts: unknown) => string,
  ) => string;
};

describe('gitCommitHash', () => {
  it('通常：7桁に切り、EAS のフルハッシュも短縮する', () => {
    expect(normalizeGitHash('abcdef1')).toBe('abcdef1');
    expect(normalizeGitHash('ABCDEF1234567890')).toBe('abcdef1');
    expect(
      readGitCommitHash({ EAS_BUILD_GIT_COMMIT_HASH: 'abcdef1234567890deadbeef' }),
    ).toBe('abcdef1');
  });

  it('空・不正は unknown。git が失敗しても落ちない', () => {
    expect(normalizeGitHash('')).toBe(UNKNOWN_GIT_HASH);
    expect(normalizeGitHash('  ')).toBe(UNKNOWN_GIT_HASH);
    expect(normalizeGitHash('not-hex')).toBe(UNKNOWN_GIT_HASH);
    expect(
      readGitCommitHash({}, () => {
        throw new Error('no git');
      }),
    ).toBe(UNKNOWN_GIT_HASH);
  });

  it('EAS が無いときは git rev-parse を使う', () => {
    const exec = jest.fn(() => 'c0ffee1\n');
    expect(readGitCommitHash({}, exec)).toBe('c0ffee1');
    expect(exec).toHaveBeenCalledWith(
      'git rev-parse --short=7 HEAD',
      expect.objectContaining({ encoding: 'utf8' }),
    );
  });
});
