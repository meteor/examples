const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { getAppConfig, listAppNames } = require('./app-config');

test('lists native example apps', () => {
  assert.deepEqual(listAppNames(), ['stock-scanner', 'city-issue-reporter', 'meteor-drop']);
});

test('configures stock scanner native flow', () => {
  const app = getAppConfig('stock-scanner');
  assert.equal(app.appId, 'com.meteor.examples.stockscanner');
  assert.equal(app.appName, 'Stock Scanner');
  assert.equal(app.androidMinSdkVersion, 26);
  assert.deepEqual(app.androidPermissions, ['android.permission.CAMERA']);
  assert.deepEqual(app.iosUsageDescriptions, {
    NSCameraUsageDescription: 'Scan product barcodes for inventory counts.',
  });
  assert.match(app.sourceDir, /examples\/stock-scanner$/);
  assert.match(app.flowPath, /native-tests\/flows\/stock-scanner\.yaml$/);
  assert.match(app.showcaseFlowPath, /native-tests\/flows\/showcase\/stock-scanner\.yaml$/);
  assert.equal(app.mediaSlug, 'stock-scanner');
  assert.equal(app.nativeIconBackgroundColor, '#126b5c');
});

test('configures civic snap native flow', () => {
  const app = getAppConfig('city-issue-reporter');
  assert.equal(app.appId, 'com.meteor.examples.civicsnap');
  assert.equal(app.appName, 'Civic Snap');
  assert.match(app.sourceDir, /examples\/city-issue-reporter$/);
  assert.match(app.flowPath, /native-tests\/flows\/city-issue-reporter\.yaml$/);
  assert.match(app.showcaseFlowPath, /native-tests\/flows\/showcase\/city-issue-reporter\.yaml$/);
  assert.equal(app.mediaSlug, 'city-issue-reporter');
  assert.equal(app.nativeIconBackgroundColor, '#0f756b');
  assert.deepEqual(app.androidPermissions, [
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION',
  ]);
  assert.deepEqual(app.iosUsageDescriptions, {
    NSCameraUsageDescription: 'Add a photo to document a reported issue.',
    NSPhotoLibraryUsageDescription: 'Choose a photo to document a reported issue.',
    NSLocationWhenInUseUsageDescription: 'Attach the issue location to a report.',
  });
});

test('accepts civic snap product name as an app alias', () => {
  const app = getAppConfig('civic-snap');
  assert.equal(app.name, 'city-issue-reporter');
  assert.equal(app.appName, 'Civic Snap');
});

test('configures Meteor Drop native flow', () => {
  const app = getAppConfig('meteor-drop');
  assert.deepEqual(app, {
    name: 'meteor-drop',
    appId: 'com.meteor.examples.meteordrop',
    appName: 'Meteor Drop',
    sourceDir: path.join(__dirname, '..', '..', 'meteor-drop'),
    flowPath: path.join(__dirname, '..', 'flows', 'meteor-drop.yaml'),
    showcaseFlowPath: path.join(__dirname, '..', 'flows', 'showcase', 'meteor-drop.yaml'),
    mediaSlug: 'meteor-drop',
    nativeIconBackgroundColor: '#2563eb',
  });
});

test('rejects unknown native example app', () => {
  assert.throws(() => getAppConfig('missing'), /Unknown native example app/);
});
