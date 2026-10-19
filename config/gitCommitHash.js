/** 設定画面に出す短縮コミット。EAS の環境変数か git。取れなければ unknown */

const UNKNOWN = 'unknown';

function normalizeGitHash(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!/^[0-9a-f]{4,40}$/.test(trimmed)) return UNKNOWN;
  return trimmed.slice(0, 7);
}

function readGitCommitHash(env = process.env, execSyncImpl) {
  const fromEas = normalizeGitHash(env.EAS_BUILD_GIT_COMMIT_HASH);
  if (fromEas !== UNKNOWN) return fromEas;

  try {
    const execSync =
      execSyncImpl ??
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('child_process').execSync;
    const stdout = execSync('git rev-parse --short=7 HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000,
    });
    return normalizeGitHash(stdout);
  } catch {
    return UNKNOWN;
  }
}

module.exports = {
  UNKNOWN_GIT_HASH: UNKNOWN,
  normalizeGitHash,
  readGitCommitHash,
};
