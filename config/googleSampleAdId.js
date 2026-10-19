/** Google のテスト広告に共通するパブリッシャー番号。app.config と実行時の両方から読む */

const GOOGLE_SAMPLE_AD_PUBLISHER = '3940256099942544';

function isGoogleSampleAdId(id) {
  return typeof id === 'string' && id.includes(GOOGLE_SAMPLE_AD_PUBLISHER);
}

module.exports = {
  GOOGLE_SAMPLE_AD_PUBLISHER,
  isGoogleSampleAdId,
};
