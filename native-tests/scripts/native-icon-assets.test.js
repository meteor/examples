const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readManifest(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertAssetContract({
  appDir,
  appName,
  themeColor,
  motifs,
}) {
  const html = read(`${appDir}/client/main.html`);
  const manifest = readManifest(`${appDir}/public/manifest.webmanifest`);
  const iconPath = path.join(ROOT, appDir, 'public', 'icons', 'app-icon.svg');
  const icon = fs.readFileSync(iconPath, 'utf8');

  assert.equal(fs.existsSync(iconPath), true);
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest"\s*\/?>/);
  assert.match(html, /<link rel="icon" href="\/icons\/app-icon\.svg" sizes="any" type="image\/svg\+xml"\s*\/?>/);
  assert.match(
    html,
    new RegExp(`<meta\\s+name="theme-color"\\s+content="${themeColor.replace('#', '\\#')}"\\s*\\/?>`)
  );

  assert.equal(manifest.name, appName);
  assert.equal(manifest.short_name, appName);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, themeColor);
  assert.equal(manifest.theme_color, themeColor);
  assert.deepEqual(manifest.icons, [
    {
      src: '/icons/app-icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
  ]);

  for (const motif of motifs) {
    assert.match(icon, new RegExp(`id="${motif}"`));
  }
}

test('Stock Scanner exposes launcher icon assets for web and native packaging', () => {
  assertAssetContract({
    appDir: 'stock-scanner',
    appName: 'Stock Scanner',
    themeColor: '#126b5c',
    motifs: ['scanner', 'package', 'scan-beam'],
  });
});

test('Civic Snap exposes launcher icon assets for web and native packaging', () => {
  assertAssetContract({
    appDir: 'city-issue-reporter',
    appName: 'Civic Snap',
    themeColor: '#0f756b',
    motifs: ['camera', 'street-damage', 'location-pin'],
  });
});

test('Meteor Escape exposes launcher icon assets for web and native packaging', () => {
  assertAssetContract({
    appDir: 'meteor-escape',
    appName: 'Meteor Escape',
    themeColor: '#eb8b6b',
    motifs: ['spacecraft', 'meteor', 'escape-star'],
  });
});
