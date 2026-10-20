declare function require(id: string): unknown;
declare const __dirname: string;

type NodePath = { join: (...parts: string[]) => string };

const { join } = require('path') as NodePath;

const {
  TEST_ADMOB_ANDROID_APP_ID,
  TEST_ADMOB_IOS_APP_ID,
  isGoogleSampleAdId,
  isProductionBuildProfile,
  resolveAdMobAppId,
} = require(join(__dirname, '../../../config/admobNativeIds.js')) as {
  TEST_ADMOB_ANDROID_APP_ID: string;
  TEST_ADMOB_IOS_APP_ID: string;
  isGoogleSampleAdId: (id: string) => boolean;
  isProductionBuildProfile: (env?: Record<string, string | undefined>) => boolean;
  resolveAdMobAppId: (platform: 'ios' | 'android', env?: Record<string, string | undefined>) => string;
};

describe('AdMob ネイティブ App ID', () => {
  it('開発では未設定ならテストID、設定があればそれを使う', () => {
    expect(resolveAdMobAppId('ios', {})).toBe(TEST_ADMOB_IOS_APP_ID);
    expect(
      resolveAdMobAppId('ios', { EXPO_PUBLIC_ADMOB_IOS_APP_ID: ' ca-app-pub-1~2 ' }),
    ).toBe('ca-app-pub-1~2');
    expect(isGoogleSampleAdId(TEST_ADMOB_IOS_APP_ID)).toBe(true);
    expect(isProductionBuildProfile({ EAS_BUILD_PROFILE: 'development' })).toBe(false);
  });

  it('本番（EAS_BUILD_PLATFORM なし）では未設定・テストIDを拒否する', () => {
    const production = { EAS_BUILD_PROFILE: 'production' };
    expect(isProductionBuildProfile(production)).toBe(true);
    expect(() => resolveAdMobAppId('ios', production)).toThrow(/EXPO_PUBLIC_ADMOB_IOS_APP_ID/);
    expect(() =>
      resolveAdMobAppId('ios', {
        ...production,
        EXPO_PUBLIC_ADMOB_IOS_APP_ID: TEST_ADMOB_IOS_APP_ID,
      }),
    ).toThrow(/テスト用/);
    expect(
      resolveAdMobAppId('android', {
        ...production,
        EXPO_PUBLIC_ADMOB_ANDROID_APP_ID: 'ca-app-pub-9~8',
      }),
    ).toBe('ca-app-pub-9~8');
  });

  it('EAS の iOS production では iOS の ID だけあれば Android は throw しない', () => {
    const env = {
      EAS_BUILD_PROFILE: 'production',
      EAS_BUILD_PLATFORM: 'ios',
      EXPO_PUBLIC_ADMOB_IOS_APP_ID: 'ca-app-pub-9~8',
    };
    expect(resolveAdMobAppId('ios', env)).toBe('ca-app-pub-9~8');
    expect(resolveAdMobAppId('android', env)).toBe(TEST_ADMOB_ANDROID_APP_ID);
  });

  it('EAS の iOS production で iOS の ID が未設定なら throw する', () => {
    expect(() =>
      resolveAdMobAppId('ios', {
        EAS_BUILD_PROFILE: 'production',
        EAS_BUILD_PLATFORM: 'ios',
      }),
    ).toThrow(/EXPO_PUBLIC_ADMOB_IOS_APP_ID/);
  });

  it('EAS の iOS production で iOS にテストIDなら throw する', () => {
    expect(() =>
      resolveAdMobAppId('ios', {
        EAS_BUILD_PROFILE: 'production',
        EAS_BUILD_PLATFORM: 'ios',
        EXPO_PUBLIC_ADMOB_IOS_APP_ID: TEST_ADMOB_IOS_APP_ID,
      }),
    ).toThrow(/テスト用/);
  });
});
