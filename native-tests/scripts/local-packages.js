const fs = require('node:fs/promises');
const path = require('node:path');

const EXAMPLES_ROOT = path.resolve(__dirname, '..', '..');
const METEOR_CHECKOUT_DIR = process.env.METEOR_CHECKOUT_DIR ||
  path.resolve(EXAMPLES_ROOT, '..', 'meteor');

const LOCAL_CHECKOUT_PACKAGES = {
  '@meteorjs/capacitor': path.join(METEOR_CHECKOUT_DIR, 'npm-packages', 'meteor-capacitor'),
  '@meteorjs/rspack': path.join(METEOR_CHECKOUT_DIR, 'npm-packages', 'meteor-rspack'),
};

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function rewriteLocalCheckoutDependencies(appDir, packageDirs = LOCAL_CHECKOUT_PACKAGES) {
  const packagePath = path.join(appDir, 'package.json');
  if (!(await pathExists(packagePath))) {
    return [];
  }

  const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
  const changed = [];

  for (const section of ['dependencies', 'devDependencies']) {
    const deps = pkg[section];
    if (!deps) continue;

    for (const [packageName, packageDir] of Object.entries(packageDirs)) {
      if (!Object.prototype.hasOwnProperty.call(deps, packageName)) continue;
      if (!String(deps[packageName]).startsWith('file:')) continue;

      const fileSpec = `file:${packageDir}`;
      if (deps[packageName] !== fileSpec) {
        deps[packageName] = fileSpec;
        changed.push(packageName);
      }
    }
  }

  if (changed.length > 0) {
    await fs.writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  return changed;
}

async function patchAndroidMinSdk(appDir, minSdkVersion) {
  if (!minSdkVersion) return false;

  const gradlePath = path.join(appDir, 'android', 'variables.gradle');
  if (!(await pathExists(gradlePath))) {
    return false;
  }

  const source = await fs.readFile(gradlePath, 'utf8');
  const updated = source.replace(
    /minSdkVersion\s*=\s*\d+/,
    `minSdkVersion = ${minSdkVersion}`
  );

  if (updated === source) {
    return false;
  }

  await fs.writeFile(gradlePath, updated);
  return true;
}

module.exports = {
  LOCAL_CHECKOUT_PACKAGES,
  METEOR_CHECKOUT_DIR,
  patchAndroidMinSdk,
  rewriteLocalCheckoutDependencies,
};
