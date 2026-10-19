import Constants from 'expo-constants';

export const UNKNOWN_GIT_HASH = 'unknown';

type ExtraWithGit = { gitCommitHash?: unknown };

/** 設定画面に出すバージョン。空や未設定なら app.json の初期値に合わせる */
export function getAppVersion(version: string | null | undefined = Constants.expoConfig?.version): string {
  const trimmed = version?.trim();
  return trimmed ? trimmed : '1.0.0';
}

/** 7桁の git ハッシュ。空・不正は unknown。クラッシュさせない */
export function normalizeGitHash(raw: string | null | undefined): string {
  const trimmed = raw?.trim().toLowerCase() ?? '';
  if (!/^[0-9a-f]{4,40}$/.test(trimmed)) return UNKNOWN_GIT_HASH;
  return trimmed.slice(0, 7);
}

function extraGitHash(): string | undefined {
  const extra = Constants.expoConfig?.extra as ExtraWithGit | undefined;
  return typeof extra?.gitCommitHash === 'string' ? extra.gitCommitHash : undefined;
}

export function getGitCommitHash(raw: string | null | undefined = extraGitHash()): string {
  return normalizeGitHash(raw);
}
