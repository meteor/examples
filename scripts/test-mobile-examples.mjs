import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultMeteorCheckout = path.resolve(repoRoot, '..', 'meteor');
const meteorBin = process.env.METEOR_BIN || path.join(defaultMeteorCheckout, 'meteor');
const appNames = ['stock-scanner', 'city-issue-reporter', 'meteor-escape'];
const localPackageDirs = [
  path.join(defaultMeteorCheckout, 'npm-packages', 'meteor-capacitor'),
  path.join(defaultMeteorCheckout, 'npm-packages', 'meteor-rspack'),
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      PATH: `${path.dirname(meteorBin)}${path.delimiter}${process.env.PATH || ''}`,
      DO_NOT_TRACK: '1',
      ...options.env,
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${options.cwd}`);
  }
}

function linkLocalPackages(appDir) {
  run('npm', ['link', '--no-save', ...localPackageDirs], { cwd: appDir });
}

for (const appName of appNames) {
  const appDir = path.join(repoRoot, appName);
  run(meteorBin, ['npm', 'install', '--no-audit', '--no-fund'], { cwd: appDir });
  linkLocalPackages(appDir);
  run('npm', ['run', 'lint'], { cwd: appDir });
  run('npm', ['run', 'test:headless'], { cwd: appDir });
  linkLocalPackages(appDir);
  run('npm', ['run', 'e2e:headless'], { cwd: appDir, env: { CI: '1' } });
}
