import Constants from 'expo-constants';

/** 設定画面に出すバージョン。空や未設定なら app.json の初期値に合わせる */
export function getAppVersion(version: string | null | undefined = Constants.expoConfig?.version): string {
  const trimmed = version?.trim();
  return trimmed ? trimmed : '1.0.0';
}
