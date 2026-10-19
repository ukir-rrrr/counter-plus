/** 短縮コミットの正規化。app.config と設定画面の両方から読む。Node API は使わない */

const UNKNOWN_GIT_HASH = 'unknown';

function normalizeGitHash(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!/^[0-9a-f]{4,40}$/.test(trimmed)) return UNKNOWN_GIT_HASH;
  return trimmed.slice(0, 7);
}

module.exports = {
  UNKNOWN_GIT_HASH,
  normalizeGitHash,
};
