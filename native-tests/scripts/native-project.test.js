const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  addAndroidPermissions,
  ensureCapacitorWebDir,
  mergeIosUsageDescriptions,
  prepareNativeProject,
} = require('./native-project');

test('adds missing Android permissions without duplicating existing entries', () => {
  const nodes = [{ getAttribute: () => 'android.permission.INTERNET' }];
  const appended = [];
  const document = {
    documentElement: { appendChild: (node) => appended.push(node) },
    getElementsByTagName: () => nodes,
    createElement: () => ({
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
    }),
  };

  assert.equal(addAndroidPermissions(document, [
    'android.permission.INTERNET',
    'android.permission.ACCESS_FINE_LOCATION',
  ]), true);
  assert.deepEqual(appended.map((node) => node.attributes['android:name']), [
    'android.permission.ACCESS_FINE_LOCATION',
  ]);
});

test('merges iOS usage descriptions idempotently', () => {
  const info = { CFBundleName: 'Example' };
  const descriptions = {
    NSCameraUsageDescription: 'Capture evidence.',
    NSLocationWhenInUseUsageDescription: 'Attach location.',
  };

  assert.equal(mergeIosUsageDescriptions(info, descriptions), true);
  assert.deepEqual(info, { CFBundleName: 'Example', ...descriptions });
  assert.equal(mergeIosUsageDescriptions(info, descriptions), false);
});

test('creates standalone Capacitor web directory only when missing', () => {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-run-webdir-'));
  const indexPath = ensureCapacitorWebDir(appDir);

  assert.equal(indexPath, path.join(appDir, '_build', 'native-dev', 'index.html'));
  assert.match(fs.readFileSync(indexPath, 'utf8'), /Meteor native launcher/);
  fs.writeFileSync(indexPath, 'keep me');
  ensureCapacitorWebDir(appDir);
  assert.equal(fs.readFileSync(indexPath, 'utf8'), 'keep me');
});

test('resolves relative Capacitor web and build context paths from app root', () => {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-run-context-'));

  assert.equal(
    ensureCapacitorWebDir(appDir, { env: { METEOR_CAPACITOR_WEB_DIR: 'custom-web' } }),
    path.join(appDir, 'custom-web', 'index.html'),
  );
  assert.equal(
    ensureCapacitorWebDir(appDir, {
      env: { CAPACITOR_BUILD_CONTEXT: 'custom-build', NODE_ENV: 'production' },
    }),
    path.join(appDir, 'custom-build', 'native-prod', 'index.html'),
  );
});

test('native patch parsers are direct dependencies of affected apps', () => {
  for (const appName of ['stock-scanner', 'city-issue-reporter']) {
    const pkg = require(path.join('..', '..', appName, 'package.json'));
    assert.match(pkg.devDependencies['@xmldom/xmldom'], /^\^0\.9\./);
    assert.match(pkg.devDependencies.plist, /^\^3\.1\./);
  }
});

test('applies app-specific Android native settings', async () => {
  const calls = [];
  const app = {
    sourceDir: '/repo/stock-scanner',
    androidMinSdkVersion: 26,
    androidPermissions: ['android.permission.CAMERA'],
  };

  await prepareNativeProject(app, 'android', {
    patchAndroidMinSdk: async (...args) => calls.push(['min-sdk', ...args]),
    patchAndroidManifest: async (...args) => calls.push(['manifest', ...args]),
  });

  assert.deepEqual(calls, [
    ['min-sdk', app.sourceDir, 26],
    ['manifest', app.sourceDir, app.androidPermissions],
  ]);
});

test('applies app-specific iOS usage descriptions', async () => {
  const calls = [];
  const app = {
    sourceDir: '/repo/civic-snap',
    iosUsageDescriptions: { NSCameraUsageDescription: 'Capture evidence.' },
  };

  await prepareNativeProject(app, 'ios', {
    patchIosInfoPlist: async (...args) => calls.push(args),
  });

  assert.deepEqual(calls, [[app.sourceDir, app.iosUsageDescriptions]]);
});
