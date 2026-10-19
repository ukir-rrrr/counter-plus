import Constants from 'expo-constants';

// app.config（config/gitCommitHash.js）と同じ正規化。実装は config/normalizeGitHash.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const gitHashUtil = require('../../../config/normalizeGitHash.js') as {
  UNKNOWN_GIT_HASH: string;
  normalizeGitHash: (raw: unknown) => string;
};

export const UNKNOWN_GIT_HASH = gitHashUtil.UNKNOWN_GIT_HASH;

type ExtraWithGit = { gitCommitHash?: unknown };

/** 設定画面に出すバージョン。空や未設定なら app.json の初期値に合わせる */
export function getAppVersion(version: string | null | undefined = Constants.expoConfig?.version): string {
  const trimmed = version?.trim();
  return trimmed ? trimmed : '1.0.0';
}

/** 7桁の git ハッシュ。空・不正は unknown。クラッシュさせない */
export function normalizeGitHash(raw: string | null | undefined): string {
  return gitHashUtil.normalizeGitHash(raw);
}

function extraGitHash(): string | undefined {
  const extra = Constants.expoConfig?.extra as ExtraWithGit | undefined;
  return typeof extra?.gitCommitHash === 'string' ? extra.gitCommitHash : undefined;
}

export function getGitCommitHash(raw: string | null | undefined = extraGitHash()): string {
  return normalizeGitHash(raw);
}
