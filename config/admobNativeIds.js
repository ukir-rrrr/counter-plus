/** AdMob のネイティブ App ID。app.config.js から読む。実キーは環境変数のみ */

/** Google 公式のサンプル App ID。開発・preview のフォールバック専用 */
const TEST_ADMOB_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';
const TEST_ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

// 判定の実体は config/googleSampleAdId.js（実行時の src/lib/ads.tsx と同じ）
const { GOOGLE_SAMPLE_AD_PUBLISHER, isGoogleSampleAdId } = require('./googleSampleAdId');
const GOOGLE_SAMPLE_PUBLISHER = GOOGLE_SAMPLE_AD_PUBLISHER;

/** Info.plist の NSUserTrackingUsageDescription。日本語で用途を説明する */
const ATT_USAGE_DESCRIPTION =
  '広告をあなたに合わせて表示するために、広告識別子を使います。許可しなくても、カウントや保存はそのまま使えます。';

function envValue(name, env = process.env) {
  const value = env[name]?.trim();
  return value ? value : null;
}

function isProductionBuildProfile(env = process.env) {
  return env.EAS_BUILD_PROFILE?.trim() === 'production';
}

/**
 * EAS がビルド中に設定する対象プラットフォーム。
 * ローカルの expo config など、未設定・不明な値は null。
 */
function easBuildPlatform(env = process.env) {
  const value = env.EAS_BUILD_PLATFORM?.trim();
  return value === 'ios' || value === 'android' ? value : null;
}

/**
 * 本番で未設定・テストIDを拒否するか。
 * EAS ビルド中は対象プラットフォームだけ厳格にし、
 * もう一方は env または Google のテストIDで埋める（throw しない）。
 * EAS_BUILD_PLATFORM が無いときは従来どおり両プラットフォームを厳格にする。
 */
function shouldEnforceProductionAdMobId(platform, env = process.env) {
  if (!isProductionBuildProfile(env)) {
    return false;
  }
  const buildPlatform = easBuildPlatform(env);
  if (buildPlatform) {
    return buildPlatform === platform;
  }
  return true;
}

/**
 * ネイティブに埋め込む AdMob App ID。
 * production ではビルド対象プラットフォームのテストID・未設定を拒否する。
 */
function resolveAdMobAppId(platform, env = process.env) {
  const name =
    platform === 'android' ? 'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID' : 'EXPO_PUBLIC_ADMOB_IOS_APP_ID';
  const fromEnv = envValue(name, env);
  const fallback = platform === 'android' ? TEST_ADMOB_ANDROID_APP_ID : TEST_ADMOB_IOS_APP_ID;

  if (shouldEnforceProductionAdMobId(platform, env)) {
    if (!fromEnv) {
      throw new Error(
        `本番ビルドには ${name} が必要です。Google のテスト用 App ID は使えません。EAS の production 環境変数を設定してください。`,
      );
    }
    if (isGoogleSampleAdId(fromEnv)) {
      throw new Error(
        `本番ビルドに Google のテスト用 AdMob App ID は使えません（${name}）。`,
      );
    }
    return fromEnv;
  }

  return fromEnv ?? fallback;
}

module.exports = {
  ATT_USAGE_DESCRIPTION,
  GOOGLE_SAMPLE_PUBLISHER,
  TEST_ADMOB_ANDROID_APP_ID,
  TEST_ADMOB_IOS_APP_ID,
  envValue,
  isGoogleSampleAdId,
  isProductionBuildProfile,
  resolveAdMobAppId,
};
