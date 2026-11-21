const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  patchAndroidMinSdk,
  rewriteLocalCheckoutDependencies,
} = require('./local-packages');

test('rewrites local checkout npm packages to absolute file specs', async () => {
  const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'examples-native-deps-'));
  const packagePath = path.join(appDir, 'package.json');
  await fs.writeFile(packagePath, JSON.stringify({
    devDependencies: {
      '@meteorjs/capacitor': 'file:../../meteor/npm-packages/meteor-capacitor',
      '@meteorjs/rspack': '^2.0.1',
      oxlint: '^1.56.0',
    },
  }, null, 2));

  const changed = await rewriteLocalCheckoutDependencies(appDir, {
    '@meteorjs/capacitor': '/repo/npm-packages/meteor-capacitor',
    '@meteorjs/rspack': '/repo/npm-packages/meteor-rspack',
  });

  const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  assert.deepEqual(changed, ['@meteorjs/capacitor']);
  assert.equal(pkg.devDependencies['@meteorjs/capacitor'], 'file:/repo/npm-packages/meteor-capacitor');
  assert.equal(pkg.devDependencies['@meteorjs/rspack'], '^2.0.1');
  assert.equal(pkg.devDependencies.oxlint, '^1.56.0');
});

test('patches Android minSdkVersion when generated project exists', async () => {
  const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'examples-native-android-'));
  const gradlePath = path.join(appDir, 'android', 'variables.gradle');
  await fs.mkdir(path.dirname(gradlePath), { recursive: true });
  await fs.writeFile(gradlePath, 'ext {\n    minSdkVersion = 23\n}\n');

  assert.equal(await patchAndroidMinSdk(appDir, 26), true);
  assert.match(await fs.readFile(gradlePath, 'utf8'), /minSdkVersion = 26/);
});
