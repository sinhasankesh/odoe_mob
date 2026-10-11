module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    'expo-web-browser',
    ['./plugins/with-dev-local-http', { enabled: process.env.APP_ALLOW_LOCAL_HTTP === 'true' }],
  ],
});
