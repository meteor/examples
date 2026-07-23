const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const EXAMPLES_ROOT = path.resolve(ROOT, '..');

const APPS = {
  'stock-scanner': {
    name: 'stock-scanner',
    appId: 'com.meteor.examples.stockscanner',
    appName: 'Stock Scanner',
    sourceDir: path.join(EXAMPLES_ROOT, 'stock-scanner'),
    flowPath: path.join(ROOT, 'flows', 'stock-scanner.yaml'),
    showcaseFlowPath: path.join(ROOT, 'flows', 'showcase', 'stock-scanner.yaml'),
    mediaSlug: 'stock-scanner',
    androidMinSdkVersion: 26,
    androidPermissions: ['android.permission.CAMERA'],
    iosUsageDescriptions: {
      NSCameraUsageDescription: 'Scan product barcodes for inventory counts.',
    },
  },
  'city-issue-reporter': {
    name: 'city-issue-reporter',
    appId: 'com.meteor.examples.civicsnap',
    appName: 'Civic Snap',
    sourceDir: path.join(EXAMPLES_ROOT, 'city-issue-reporter'),
    flowPath: path.join(ROOT, 'flows', 'city-issue-reporter.yaml'),
    showcaseFlowPath: path.join(ROOT, 'flows', 'showcase', 'city-issue-reporter.yaml'),
    mediaSlug: 'city-issue-reporter',
    androidPermissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    iosUsageDescriptions: {
      NSCameraUsageDescription: 'Add a photo to document a reported issue.',
      NSPhotoLibraryUsageDescription: 'Choose a photo to document a reported issue.',
      NSLocationWhenInUseUsageDescription: 'Attach the issue location to a report.',
    },
  },
  'meteor-drop': {
    name: 'meteor-drop',
    appId: 'com.meteor.examples.meteordrop',
    appName: 'Meteor Drop',
    sourceDir: path.join(EXAMPLES_ROOT, 'meteor-drop'),
    flowPath: path.join(ROOT, 'flows', 'meteor-drop.yaml'),
    showcaseFlowPath: path.join(ROOT, 'flows', 'showcase', 'meteor-drop.yaml'),
    mediaSlug: 'meteor-drop',
  },
};

const APP_ALIASES = {
  'civic-snap': 'city-issue-reporter',
};

function listAppNames() {
  return Object.keys(APPS);
}

function getAppConfig(name) {
  const app = APPS[APP_ALIASES[name] || name];
  if (!app) {
    throw new Error(`Unknown native example app: ${name}`);
  }
  return { ...app };
}

module.exports = {
  getAppConfig,
  listAppNames,
};
