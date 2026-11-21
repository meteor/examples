const { defineConfig } = require('@meteorjs/capacitor');

module.exports = defineConfig(() => ({
  appId: 'com.meteor.examples.civicsnap',
  appName: 'Civic Snap',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
}));
