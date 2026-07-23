const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  addAndroidPermissions,
  ensureCapacitorWebDir,
  generateNativeIconAssets,
  mergeIosUsageDescriptions,
  prepareNativeProject,
  verifyNativeIconAssets,
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

test('native setup tools are direct dependencies of affected apps', () => {
  for (const appName of ['stock-scanner', 'city-issue-reporter']) {
    const pkg = require(path.join('..', '..', appName, 'package.json'));
    assert.match(pkg.devDependencies['@xmldom/xmldom'], /^\^0\.9\./);
    assert.match(pkg.devDependencies.plist, /^\^3\.1\./);
  }

  for (const appName of ['stock-scanner', 'city-issue-reporter', 'meteor-drop']) {
    const pkg = require(path.join('..', '..', appName, 'package.json'));
    assert.match(pkg.devDependencies['@capacitor/assets'], /^\^3\.0\./);
  }
});

test('generates a platform launcher icon from each app SVG source', () => {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-run-icon-'));
  const iconDir = path.join(appDir, 'public', 'icons');
  fs.mkdirSync(iconDir, { recursive: true });
  fs.writeFileSync(path.join(iconDir, 'app-icon.svg'), '<svg />');

  const calls = [];
  generateNativeIconAssets({
    sourceDir: appDir,
    nativeIconBackgroundColor: '#126b5c',
  }, 'ios', {
    spawnSyncImpl(command, args, options) {
      calls.push({ command, args, options });
      const assetPath = path.join(appDir, 'assets');
      assert.ok(fs.existsSync(path.join(assetPath, 'logo.svg')));
      const output = path.join(
        appDir,
        'ios',
        'App',
        'App',
        'Assets.xcassets',
        'AppIcon.appiconset',
        'Contents.json',
      );
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, '{}');
      return { status: 0 };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, path.join(appDir, 'node_modules', '.bin', 'capacitor-assets'));
  assert.deepEqual(calls[0].args.slice(0, 2), ['generate', '--ios']);
  assert.equal(calls[0].args.includes('--asset-path'), false);
  assert.ok(calls[0].args.includes('--iconBackgroundColor'));
  assert.ok(calls[0].args.includes('#126b5c'));
  assert.equal(calls[0].options.cwd, appDir);
});

test('verifies generated platform launcher assets', () => {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-run-icon-output-'));
  const iosIconSet = path.join(appDir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  const androidIcon = path.join(appDir, 'android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png');
  fs.mkdirSync(iosIconSet, { recursive: true });
  fs.mkdirSync(path.dirname(androidIcon), { recursive: true });
  fs.writeFileSync(path.join(iosIconSet, 'Contents.json'), '{}');
  fs.writeFileSync(androidIcon, 'png');

  assert.equal(verifyNativeIconAssets({ sourceDir: appDir }, 'ios'), true);
  assert.equal(verifyNativeIconAssets({ sourceDir: appDir }, 'android'), true);
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
    generateNativeIconAssets: async (...args) => calls.push(['icons', ...args]),
  });

  assert.deepEqual(calls, [
    ['min-sdk', app.sourceDir, 26],
    ['manifest', app.sourceDir, app.androidPermissions],
    ['icons', app, 'android'],
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
    generateNativeIconAssets: async (...args) => calls.push(['icons', ...args]),
  });

  assert.deepEqual(calls, [
    [app.sourceDir, app.iosUsageDescriptions],
    ['icons', app, 'ios'],
  ]);
});
