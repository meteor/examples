const { defineConfig } = require('@meteorjs/capacitor');

module.exports = defineConfig(() => ({
  appId: 'com.meteor.examples.meteordrop',
  appName: 'Meteor Drop',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
}));
