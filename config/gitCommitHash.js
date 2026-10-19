/** 設定画面に出す短縮コミット。EAS の環境変数か git。取れなければ unknown */

// 正規化の実体は config/normalizeGitHash.js（実行時の src/features/settings/version.ts と同じ）
const { UNKNOWN_GIT_HASH, normalizeGitHash } = require('./normalizeGitHash');

function readGitCommitHash(env = process.env, execSyncImpl) {
  const fromEas = normalizeGitHash(env.EAS_BUILD_GIT_COMMIT_HASH);
  if (fromEas !== UNKNOWN_GIT_HASH) return fromEas;

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
    return UNKNOWN_GIT_HASH;
  }
}

module.exports = {
  UNKNOWN_GIT_HASH,
  normalizeGitHash,
  readGitCommitHash,
};
