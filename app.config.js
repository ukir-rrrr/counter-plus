// 動的な Expo 設定。AdMob の App ID は環境変数から読む（本番ではテストID禁止）
const appJson = require('./app.json');
const {
  ATT_USAGE_DESCRIPTION,
  resolveAdMobAppId,
} = require('./config/admobNativeIds');
const { readGitCommitHash } = require('./config/gitCommitHash');

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
      iosAppId: resolveAdMobAppId('ios'),
      androidAppId: resolveAdMobAppId('android'),
      userTrackingUsageDescription: ATT_USAGE_DESCRIPTION,
      delayAppMeasurementInit: true,
    },
  ]);

  return {
    ...appJson.expo,
    plugins,
    extra: {
      ...(appJson.expo.extra ?? {}),
      gitCommitHash: readGitCommitHash(),
    },
  };
};
