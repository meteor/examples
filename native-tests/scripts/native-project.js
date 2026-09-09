const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { patchAndroidMinSdk } = require('./local-packages');

function requireFromApp(appDir, packageName) {
  return createRequire(path.join(appDir, 'package.json'))(packageName);
}

function addAndroidPermissions(document, permissions = []) {
  const permissionNodes = document.getElementsByTagName('uses-permission');
  const existing = new Set();
  for (let index = 0; index < permissionNodes.length; index += 1) {
    const node = permissionNodes[index] || permissionNodes.item(index);
    existing.add(node.getAttribute('android:name'));
  }

  let changed = false;
  for (const permission of permissions) {
    if (existing.has(permission)) continue;
    const node = document.createElement('uses-permission');
    node.setAttribute('android:name', permission);
    document.documentElement.appendChild(node);
    existing.add(permission);
    changed = true;
  }
  return changed;
}

function mergeIosUsageDescriptions(info, descriptions = {}) {
  let changed = false;
  for (const [key, value] of Object.entries(descriptions)) {
    if (info[key] === value) continue;
    info[key] = value;
    changed = true;
  }
  return changed;
}

function ensureCapacitorWebDir(appDir, { env = process.env } = {}) {
  const mode = env.NODE_ENV === 'production' ? 'prod' : 'dev';
  const buildContext = env.METEOR_BUILD_CONTEXT ||
    env.RSPACK_BUILD_CONTEXT ||
    env.CAPACITOR_BUILD_CONTEXT ||
    '_build';
  const configuredWebDir = env.METEOR_CAPACITOR_WEB_DIR ||
    path.join(buildContext, `native-${mode}`);
  const webDir = path.isAbsolute(configuredWebDir)
    ? configuredWebDir
    : path.resolve(appDir, configuredWebDir);
  const indexPath = path.join(webDir, 'index.html');
  fs.mkdirSync(webDir, { recursive: true });
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, '<!doctype html><title>Meteor native launcher</title>\n');
  }
  return indexPath;
}

async function patchAndroidManifest(appDir, permissions, {
  loadXml = (sourceDir) => requireFromApp(sourceDir, '@xmldom/xmldom'),
} = {}) {
  if (!permissions?.length) return false;
  const manifestPath = path.join(appDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Android manifest not found after platform setup: ${manifestPath}`);
  }
  const { DOMParser, XMLSerializer } = loadXml(appDir);
  const document = new DOMParser().parseFromString(fs.readFileSync(manifestPath, 'utf8'), 'text/xml');
  const changed = addAndroidPermissions(document, permissions);
  if (changed) {
    fs.writeFileSync(manifestPath, `${new XMLSerializer().serializeToString(document)}\n`);
  }
  return changed;
}

async function patchIosInfoPlist(appDir, descriptions, {
  loadPlist = (sourceDir) => requireFromApp(sourceDir, 'plist'),
} = {}) {
  if (!descriptions || Object.keys(descriptions).length === 0) return false;
  const plistPath = path.join(appDir, 'ios', 'App', 'App', 'Info.plist');
  if (!fs.existsSync(plistPath)) {
    throw new Error(`iOS Info.plist not found after platform setup: ${plistPath}`);
  }
  const plist = loadPlist(appDir);
  const info = plist.parse(fs.readFileSync(plistPath, 'utf8'));
  const changed = mergeIosUsageDescriptions(info, descriptions);
  if (changed) fs.writeFileSync(plistPath, plist.build(info));
  return changed;
}

function nativeIconOutputPath(appDir, platform) {
  if (platform === 'ios') {
    return path.join(appDir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'Contents.json');
  }
  return path.join(appDir, 'android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png');
}

function verifyNativeIconAssets(app, platform) {
  const outputPath = nativeIconOutputPath(app.sourceDir, platform);
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Native ${platform} launcher icon was not generated: ${outputPath}`);
  }
  return true;
}

function generateNativeIconAssets(app, platform, {
  spawnSyncImpl = spawnSync,
} = {}) {
  const sourceIconPath = path.join(app.sourceDir, 'public', 'icons', 'app-icon.svg');
  if (!fs.existsSync(sourceIconPath)) {
    throw new Error(`Native icon source not found: ${sourceIconPath}`);
  }

  const assetPath = path.join(app.sourceDir, 'assets');
  if (fs.existsSync(assetPath)) {
    throw new Error(`Cannot stage native icon assets because this directory already exists: ${assetPath}`);
  }

  try {
    fs.mkdirSync(assetPath);
    fs.copyFileSync(sourceIconPath, path.join(assetPath, 'logo.svg'));
    const command = path.join(
      app.sourceDir,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'capacitor-assets.cmd' : 'capacitor-assets',
    );
    const result = spawnSyncImpl(command, [
      'generate',
      `--${platform}`,
      '--iconBackgroundColor', app.nativeIconBackgroundColor || '#ffffff',
      '--splashBackgroundColor', app.nativeIconBackgroundColor || '#ffffff',
    ], {
      cwd: app.sourceDir,
      stdio: 'inherit',
    });

    if (result.error) {
      throw new Error(`Unable to generate native ${platform} icon: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(`Native ${platform} icon generator exited with code ${result.status}`);
    }
  } finally {
    fs.rmSync(assetPath, { recursive: true, force: true });
  }

  return verifyNativeIconAssets(app, platform);
}

async function prepareNativeProject(app, platform, {
  patchAndroidMinSdk: patchMinSdk = patchAndroidMinSdk,
  patchAndroidManifest: patchManifest = patchAndroidManifest,
  patchIosInfoPlist: patchInfoPlist = patchIosInfoPlist,
  generateNativeIconAssets: generateIcons = generateNativeIconAssets,
} = {}) {
  if (platform === 'android') {
    if (app.androidMinSdkVersion) {
      await patchMinSdk(app.sourceDir, app.androidMinSdkVersion);
    }
    if (app.androidPermissions?.length) {
      await patchManifest(app.sourceDir, app.androidPermissions);
    }
  } else if (platform === 'ios' && app.iosUsageDescriptions) {
    await patchInfoPlist(app.sourceDir, app.iosUsageDescriptions);
  }
  await generateIcons(app, platform);
}

module.exports = {
  addAndroidPermissions,
  ensureCapacitorWebDir,
  generateNativeIconAssets,
  mergeIosUsageDescriptions,
  patchAndroidManifest,
  patchIosInfoPlist,
  prepareNativeProject,
  verifyNativeIconAssets,
};
