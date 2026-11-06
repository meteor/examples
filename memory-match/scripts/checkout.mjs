import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const expectedBranch = 'rspack-rstest-integration';

const requiredPaths = [
  'meteor',
  'packages/rspack/package.js',
  'packages/rstest/package.js',
  'npm-packages/meteor-rspack/package.json',
  'npm-packages/meteor-rstest/package.json',
];

export function resolveCheckout(env = process.env) {
  const configuredRoot = env.METEOR_CHECKOUT || path.resolve(appRoot, '../../meteor');
  if (!path.isAbsolute(configuredRoot)) {
    throw new Error(`METEOR_CHECKOUT must be absolute: ${configuredRoot}`);
  }
  const root = existsSync(configuredRoot) ? realpathSync(configuredRoot) : configuredRoot;
  const missing = requiredPaths.filter((relative) => !existsSync(path.join(root, relative)));
  if (missing.length) {
    throw new Error(
      `Meteor checkout is incomplete at ${root}. Missing:\n${missing.join('\n')}\n` +
      `Set METEOR_CHECKOUT to a checkout of ${expectedBranch}.`,
    );
  }
  const branch = env.METEOR_RSTEST_BRANCH || expectedBranch;
  const result = spawnSync('git', ['-C', root, 'branch', '--show-current'], {
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Unable to inspect Meteor checkout branch: ${result.error?.message || result.stderr}`);
  }
  const currentBranch = result.stdout.trim();
  if (currentBranch !== branch) {
    throw new Error(
      `Meteor checkout branch is ${currentBranch || '(detached HEAD)'}; expected ${branch}. ` +
      'Use a checkout on the required branch, or set METEOR_RSTEST_BRANCH for a compatible development branch.',
    );
  }
  return Object.freeze({
    root,
    branch,
    meteorBinary: path.join(root, 'meteor'),
    packagesDir: path.join(root, 'packages'),
    rspackNpmPackage: path.join(root, 'npm-packages/meteor-rspack'),
    rstestNpmPackage: path.join(root, 'npm-packages/meteor-rstest'),
  });
}

export function withCheckoutEnvironment(checkout, env = process.env) {
  return {
    ...env,
    PATH: [checkout.root, env.PATH].filter(Boolean).join(path.delimiter),
    METEOR_CHECKOUT: checkout.root,
    METEOR_PACKAGE_DIRS: [checkout.packagesDir, env.METEOR_PACKAGE_DIRS].filter(Boolean).join(path.delimiter),
    METEOR_RSPACK_NPM_SPEC: checkout.rspackNpmPackage,
    METEOR_RSTEST_NPM_SPEC: checkout.rstestNpmPackage,
    DO_NOT_TRACK: env.DO_NOT_TRACK || '1',
  };
}

// Stable app-relative specs keep machine paths out of package.json and its lockfile.
// npm's install-links option copies these packages into the app so their imports
// resolve against the app's dependency tree instead of the Meteor repository.
export function prepareLocalPackages(checkout, root = appRoot) {
  const directory = path.join(root, '.meteor/local/npm');
  mkdirSync(directory, { recursive: true });
  for (const [name, source] of [
    ['meteor-rspack', checkout.rspackNpmPackage],
    ['meteor-rstest', checkout.rstestNpmPackage],
  ]) {
    const target = path.join(directory, name);
    const existing = lstatSync(target, { throwIfNoEntry: false });
    if (existing && !existing.isSymbolicLink()) {
      throw new Error(`Expected a generated package symlink at ${target}`);
    }
    if (existing) unlinkSync(target);
    symlinkSync(source, target, 'dir');
    // Refresh same-version checkout packages when setup is run again.
    rmSync(path.join(root, 'node_modules/@meteorjs', name.slice('meteor-'.length)), {
      recursive: true,
      force: true,
    });
  }
}

export function createSetupPlan({ checkout, appRoot: root }) {
  return [
    {
      command: checkout.meteorBinary,
      args: ['npm', 'install', '--include=dev', '--install-links=true', '--no-audit', '--no-fund'],
      cwd: root,
    },
    { command: checkout.meteorBinary, args: ['lint'], cwd: root },
  ];
}

// The experimental checkout still requires the pre-v2 default export here.
// Patch only the app's installed copy; the source checkout remains untouched.
// Remove this once rspack-rstest-integration accepts the v2 named export.
export function patchInstalledReactRefresh(root = appRoot) {
  const configPath = path.join(root, 'node_modules/@meteorjs/rspack/rspack.config.js');
  const source = readFileSync(configPath, 'utf8');
  const original = '? safeRequire("@rspack/plugin-react-refresh")';
  if (!source.includes(original)) return false;
  const replacement = `? (() => {
        const refresh = safeRequire("@rspack/plugin-react-refresh");
        return refresh?.ReactRefreshRspackPlugin ?? refresh?.default ?? refresh;
      })()`;
  writeFileSync(configPath, source.replace(original, replacement));
  return true;
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\"'\"'")}'`;
}

export function renderCheckoutLauncher(checkout) {
  return [
    '#!/bin/sh',
    'set -eu',
    `checkout=${shellQuote(checkout.root)}`,
    `expected=${shellQuote(checkout.branch)}`,
    'current=$(git -C "$checkout" branch --show-current)',
    'if [ "$current" != "$expected" ]; then',
    '  printf "Meteor checkout branch is %s; expected %s. Rerun npm run setup with a compatible checkout.\\n" "${current:-detached HEAD}" "$expected" >&2',
    '  exit 2',
    'fi',
    'export PATH="$checkout:$PATH"',
    'export METEOR_CHECKOUT="$checkout"',
    'export METEOR_PACKAGE_DIRS="$checkout/packages${METEOR_PACKAGE_DIRS:+:$METEOR_PACKAGE_DIRS}"',
    'export METEOR_RSPACK_NPM_SPEC="$checkout/npm-packages/meteor-rspack"',
    'export METEOR_RSTEST_NPM_SPEC="$checkout/npm-packages/meteor-rstest"',
    'export DO_NOT_TRACK="${DO_NOT_TRACK:-1}"',
    'exec "$checkout/meteor" "$@"',
    '',
  ].join('\n');
}

export function writeCheckoutLauncher({ checkout, appRoot: root }) {
  const launcherPath = path.join(root, 'meteor-checkout');
  const temporaryPath = `${launcherPath}.tmp-${process.pid}`;
  try {
    writeFileSync(temporaryPath, renderCheckoutLauncher(checkout), { mode: 0o755 });
    renameSync(temporaryPath, launcherPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
  return launcherPath;
}
