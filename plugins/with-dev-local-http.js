const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withDevLocalHttp(config, options = {}) {
  if (!options.enabled) return config;

  config = withInfoPlist(config, (mod) => {
    const transport = mod.modResults.NSAppTransportSecurity || {};
    mod.modResults.NSLocalNetworkUsageDescription =
      'Odoe connects to your development server on this Wi-Fi network while you test the app.';
    mod.modResults.NSAppTransportSecurity = {
      ...transport,
      NSAllowsLocalNetworking: true,
    };
    return mod;
  });

  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application) application.$['android:usesCleartextTraffic'] = 'true';
    return mod;
  });

  return config;
};
