import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync,
  rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  expectedBranch, patchInstalledReactRefresh, prepareLocalPackages, resolveCheckout,
  withCheckoutEnvironment, writeCheckoutLauncher,
} from '../../scripts/checkout.mjs';

function git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

function temporaryRoot(t) {
  // Exercise shell quoting as well as ordinary paths.
  const root = mkdtempSync(path.join(tmpdir(), "memory match's "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function fakeCheckout(t, branch = expectedBranch) {
  const root = temporaryRoot(t);
  for (const relative of [
    'meteor', 'packages/rspack/package.js', 'packages/rstest/package.js',
    'npm-packages/meteor-rspack/package.json', 'npm-packages/meteor-rstest/package.json',
  ]) {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, 'fixture');
  }
  git(root, 'init', '--initial-branch', branch);
  return root;
}

test('rejects relative checkout paths and lists missing capabilities', (t) => {
  assert.throws(() => resolveCheckout({ METEOR_CHECKOUT: '../meteor' }), /must be absolute/);
  const root = temporaryRoot(t);
  assert.throws(() => resolveCheckout({ METEOR_CHECKOUT: root }),
    /meteor.*packages\/rspack.*packages\/rstest.*meteor-rspack.*meteor-rstest/s);
});

test('refuses the wrong branch without changing the checkout', (t) => {
  const root = fakeCheckout(t, 'capacitor-integration');
  assert.throws(() => resolveCheckout({ METEOR_CHECKOUT: root }),
    /branch is capacitor-integration; expected rspack-rstest-integration/);
  const checkout = resolveCheckout({
    METEOR_CHECKOUT: root, METEOR_RSTEST_BRANCH: 'capacitor-integration',
  });
  assert.equal(checkout.branch, 'capacitor-integration');
});

test('normalizes checkout paths and preserves custom package directories', (t) => {
  const root = fakeCheckout(t);
  const checkout = resolveCheckout({ METEOR_CHECKOUT: root });
  const env = withCheckoutEnvironment(checkout, { PATH: '/usr/bin', METEOR_PACKAGE_DIRS: '/custom' });
  assert.equal(checkout.root, realpathSync(root));
  assert.equal(env.PATH, `${checkout.root}${path.delimiter}/usr/bin`);
  assert.equal(env.METEOR_PACKAGE_DIRS, `${checkout.packagesDir}${path.delimiter}/custom`);
  assert.equal(env.METEOR_RSPACK_NPM_SPEC, checkout.rspackNpmPackage);
  assert.equal(env.METEOR_RSTEST_NPM_SPEC, checkout.rstestNpmPackage);
});

test('setup refreshes local links and copied integrations without altering the manifest', (t) => {
  const checkout = resolveCheckout({ METEOR_CHECKOUT: fakeCheckout(t) });
  const root = temporaryRoot(t);
  const manifest = '{"name":"fixture"}\n';
  writeFileSync(path.join(root, 'package.json'), manifest);
  const installed = path.join(root, 'node_modules/@meteorjs/rstest');
  mkdirSync(installed, { recursive: true });
  writeFileSync(path.join(installed, 'old.js'), 'old checkout');
  prepareLocalPackages(checkout, root);
  prepareLocalPackages(checkout, root);
  assert.equal(realpathSync(path.join(root, '.meteor/local/npm/meteor-rstest')), checkout.rstestNpmPackage);
  assert.equal(existsSync(installed), false);
  assert.equal(readFileSync(path.join(root, 'package.json'), 'utf8'), manifest);
});

test('launcher preserves arguments, environment, exit status, and checks later branch changes', (t) => {
  const root = fakeCheckout(t);
  const projectRoot = temporaryRoot(t);
  const meteorBinary = path.join(root, 'meteor');
  writeFileSync(meteorBinary, `#!/bin/sh
printf 'meteor=%s\\n' "$(command -v meteor)"
printf 'packageDirs=%s\\n' "$METEOR_PACKAGE_DIRS"
printf 'rspack=%s\\n' "$METEOR_RSPACK_NPM_SPEC"
printf 'rstest=%s\\n' "$METEOR_RSTEST_NPM_SPEC"
printf 'arg=%s\\n' "$@"
exit 23
`);
  chmodSync(meteorBinary, 0o755);
  const checkout = resolveCheckout({ METEOR_CHECKOUT: root });
  const launcher = writeCheckoutLauncher({ checkout, appRoot: projectRoot });
  const args = ['test', '--test-name-pattern', "player's score", '--', '--retry', '2'];
  const run = () => spawnSync(launcher, args, {
    encoding: 'utf8', env: { ...process.env, METEOR_PACKAGE_DIRS: '/custom/packages' },
  });
  const result = run();
  assert.equal(result.status, 23, result.stderr);
  assert.equal(result.stderr, '');
  assert(result.stdout.includes(`meteor=${checkout.meteorBinary}\n`));
  assert(result.stdout.includes(`packageDirs=${checkout.packagesDir}:/custom/packages\n`));
  assert(result.stdout.includes(`rspack=${checkout.rspackNpmPackage}\n`));
  assert(result.stdout.includes(`rstest=${checkout.rstestNpmPackage}\n`));
  assert(result.stdout.endsWith(args.map((arg) => `arg=${arg}\n`).join('')));
  assert.equal(statSync(launcher).mode & 0o777, 0o755);
  git(root, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  const changed = run();
  assert.equal(changed.status, 2);
  assert.match(changed.stderr, /branch is main; expected rspack-rstest-integration/);
  assert.equal(changed.stdout, '');
});

test('development compatibility accepts the v2 React Refresh constructor and is idempotent', (t) => {
  const root = temporaryRoot(t);
  const config = path.join(root, 'node_modules/@meteorjs/rspack/rspack.config.js');
  mkdirSync(path.dirname(config), { recursive: true });
  writeFileSync(config, `
    const reactRefreshModule = isReactEnabled
      ? safeRequire("@rspack/plugin-react-refresh")
      : null;
    return reactRefreshModule ? new reactRefreshModule() : null;
  `);
  assert.equal(patchInstalledReactRefresh(root), true);
  const patched = readFileSync(config, 'utf8');
  const run = new Function('isReactEnabled', 'safeRequire', patched);
  class RefreshPlugin {}
  for (const module of [{ ReactRefreshRspackPlugin: RefreshPlugin }, { default: RefreshPlugin }, RefreshPlugin]) {
    assert(run(true, () => module) instanceof RefreshPlugin);
  }
  assert.equal(run(false, () => { throw new Error('should not load'); }), null);
  assert.equal(run(true, () => null), null);
  assert.equal(patchInstalledReactRefresh(root), false);
  assert.equal(readFileSync(config, 'utf8'), patched);
});
