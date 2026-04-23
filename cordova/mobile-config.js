const version = '1.0.0';
const [major, minor, patch] = version.split('.');
const buildNumber = `${major * 10000 + minor * 1000 + patch * 100}`;

const appStoreIcon = 'private/assets/icon.png';
const iosIconsFolder = 'private/assets/res/icon/ios';
const androidIconsFolder = 'private/assets/res/icon/android';
const iosSplashScreensFolder = '../../../private/assets/res/screen/ios';
const androidSplashScreensFolder = 'private/assets/res/screen/android';

let idName = null;
let urlUniversalLink = null;
let schemeUniversalLink = 'https';

switch (this.process.env.MOBILE_APP_ID) {
  case 'com.meteorapp.mobile':
    console.log('--> mobile-config - production build');
    idName = {
      id: 'com.meteorapp.mobile',
      name: 'Contacts',
    };
    urlUniversalLink = 'mobile.meteorapp.com';
    break;
  case 'com.meteorapp.stagingmobile':
    console.log('--> mobile-config - staging build');
    idName = {
      id: 'com.meteorapp.stagingmobile',
      name: 'ContactsS',
    };
    urlUniversalLink = 'stagingmobile.meteorapp.com';
    break;
  default:
    console.log('--> mobile-config - development build');
    idName = {
      id: 'localhost.mobile',
      name: 'ContactsDev',
    };
    urlUniversalLink = 'localhost:5000';
    schemeUniversalLink = 'http';
}

App.info(
  Object.assign(
    {
      version,
      buildNumber,
      description: 'A contacts directory built with Meteor and Framework7',
      author: 'Meteor',
      email: 'hello@meteorapp.com',
      website: 'meteor.com',
    },
    idName
  )
);

App.setPreference('BackgroundColor', '0xffe45735');
App.setPreference('StatusBarBackgroundColor', '#e45735');
App.setPreference('StatusBarStyle', 'lightcontent');

// Fix App Error connection to the server was unsuccessful.
App.setPreference('LoadUrlTimeoutValue', '1000000', 'android');
App.setPreference('WebAppStartupTimeout', '1000000', 'android');

App.setPreference(
  'universallink',
  `${schemeUniversalLink}://${urlUniversalLink}`
);
App.setPreference('WebAppStartupTimeout', 120000);

App.accessRule('http://*', { type: 'navigation' });
App.accessRule('https://*', { type: 'navigation' });
App.accessRule('http://*', { type: 'network' });
App.accessRule('https://*', { type: 'network' });

App.icons({
  app_store: appStoreIcon,
  iphone_2x: `${iosIconsFolder}/icon-60@2x.png`,
  iphone_3x: `${iosIconsFolder}/icon-60@3x.png`,
  ipad_2x: `${iosIconsFolder}/icon-76@2x.png`,
  ipad_pro: `${iosIconsFolder}/icon-83.5@2x.png`,
  ios_settings_2x: `${iosIconsFolder}/icon-small@2x.png`,
  ios_settings_3x: `${iosIconsFolder}/icon-small@3x.png`,
  ios_spotlight_2x: `${iosIconsFolder}/icon-small-40@2x.png`,
  ios_spotlight_3x: `${iosIconsFolder}/icon-small-40@3x.png`,
  ios_notification_2x: `${iosIconsFolder}/icon-small-40.png`,
  ios_notification_3x: `${iosIconsFolder}/icon-60.png`,
  ipad: `${iosIconsFolder}/icon-76.png`,
  ios_settings: `${iosIconsFolder}/icon-small.png`,
  ios_spotlight: `${iosIconsFolder}/icon-small-40.png`,
  ios_notification: `${iosIconsFolder}/icon-small-40.png`,
  iphone_legacy: `${iosIconsFolder}/icon.png`,
  iphone_legacy_2x: `${iosIconsFolder}/icon@2x.png`,
  ipad_spotlight_legacy: `${iosIconsFolder}/icon-small-50.png`,
  ipad_spotlight_legacy_2x: `${iosIconsFolder}/icon-small-50@2x.png`,
  ipad_app_legacy: `${iosIconsFolder}/icon-72.png`,
  ipad_app_legacy_2x: `${iosIconsFolder}/icon-72@2x.png`,
  android_mdpi: `${androidIconsFolder}/mdpi.png`,
  android_hdpi: `${androidIconsFolder}/hdpi.png`,
  android_xhdpi: `${androidIconsFolder}/xhdpi.png`,
  android_xxhdpi: `${androidIconsFolder}/xxhdpi.png`,
  android_xxxhdpi: `${androidIconsFolder}/xxxhdpi.png`,
});

App.launchScreens({
  android_mdpi_portrait: `${androidSplashScreensFolder}/splash-port-mdpi.png`,
  android_mdpi_landscape: `${androidSplashScreensFolder}/splash-land-mdpi.png`,
  android_hdpi_portrait: `${androidSplashScreensFolder}/splash-port-hdpi.png`,
  android_hdpi_landscape: `${androidSplashScreensFolder}/splash-land-hdpi.png`,
  android_xhdpi_portrait: `${androidSplashScreensFolder}/splash-port-xhdpi.png`,
  android_xhdpi_landscape: `${androidSplashScreensFolder}/splash-land-xhdpi.png`,
  android_xxhdpi_portrait: `${androidSplashScreensFolder}/splash-port-xxhdpi.png`,
  android_xxhdpi_landscape: `${androidSplashScreensFolder}/splash-land-xxhdpi.png`,
  android_xxxhdpi_portrait: `${androidSplashScreensFolder}/splash-port-xxxhdpi.png`,
  android_xxxhdpi_landscape: `${androidSplashScreensFolder}/splash-land-xxxhdpi.png`,
});

App.appendToConfig(`
  <platform name="ios">
    <splash src="${iosSplashScreensFolder}/Default@2x~universal~anyany.png" />
  </platform>
  <platform name="android">
    <preference name="android-targetSdkVersion" value="29" />
    <preference name="android-minSdkVersion" value="20" />
  </platform>
  <universal-links>
    <host name="${urlUniversalLink}" scheme="${schemeUniversalLink}" />
  </universal-links>
  <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application" xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:usesCleartextTraffic="true"></application>
  </edit-config>
`);
