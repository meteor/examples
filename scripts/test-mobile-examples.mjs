import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nativeLauncher from '../native-tests/scripts/run-native.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const runtime = nativeLauncher.resolveRuntime({}, { examplesRoot: repoRoot });
const { meteorBin } = runtime;
const appNames = ['stock-scanner', 'city-issue-reporter', 'meteor-drop'];

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

async function installLocalPackages(appDir) {
  const result = await nativeLauncher.spawnStep({
    action: 'install-local-packages',
    meteorBin,
    packageDirs: runtime.localPackageDirs,
    cwd: appDir,
  });
  if (result.code !== 0 || result.signal) {
    throw new Error(`Checkout package installation failed in ${appDir}`);
  }
}

for (const appName of appNames) {
  const appDir = path.join(repoRoot, appName);
  await installLocalPackages(appDir);
  run('npm', ['run', 'lint'], { cwd: appDir });
  run('npm', ['run', 'test:headless'], { cwd: appDir });
  await installLocalPackages(appDir);
  run('npm', ['run', 'e2e:headless'], { cwd: appDir, env: { CI: '1' } });
}
