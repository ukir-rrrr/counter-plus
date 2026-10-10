module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Drizzle のマイグレーション（.sql）をバンドルに含める
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
