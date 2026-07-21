const { defineConfig } = require('@meteorjs/capacitor');

module.exports = defineConfig(() => ({
  appId: 'com.meteor.examples.meteorescape',
  appName: 'Meteor Escape',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
}));
