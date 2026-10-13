// 動的な Expo 設定。AdMob の App ID は環境変数から読む（無いときは Google のサンプルID）
const appJson = require('./app.json');

/** Info.plist の NSUserTrackingUsageDescription。日本語で用途を説明する */
const ATT_USAGE_DESCRIPTION =
  '広告をあなたに合わせて表示するために、広告識別子を使います。許可しなくても、カウントや保存はそのまま使えます。';

/** Google 公式のサンプル App ID。開発ビルド用。本番は環境変数で上書きする */
const TEST_ADMOB_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';
const TEST_ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

function envValue(name) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function pluginName(plugin) {
  return Array.isArray(plugin) ? plugin[0] : plugin;
}

module.exports = () => {
  const plugins = (appJson.expo.plugins ?? []).filter((plugin) => {
    const name = pluginName(plugin);
    return name !== 'react-native-google-mobile-ads' && name !== 'expo-tracking-transparency';
  });

  plugins.push([
    'expo-tracking-transparency',
    { userTrackingPermission: ATT_USAGE_DESCRIPTION },
  ]);

  plugins.push([
    'react-native-google-mobile-ads',
    {
      iosAppId: envValue('EXPO_PUBLIC_ADMOB_IOS_APP_ID') ?? TEST_ADMOB_IOS_APP_ID,
      androidAppId: envValue('EXPO_PUBLIC_ADMOB_ANDROID_APP_ID') ?? TEST_ADMOB_ANDROID_APP_ID,
      userTrackingUsageDescription: ATT_USAGE_DESCRIPTION,
    },
  ]);

  return {
    ...appJson.expo,
    plugins,
  };
};
