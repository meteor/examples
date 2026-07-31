#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { getAppConfig } = require('./app-config');
const { ensureCapacitorWebDir, prepareNativeProject } = require('./native-project');

const EXAMPLES_ROOT = path.resolve(__dirname, '..', '..');
const PLATFORMS = new Set(['android', 'ios']);

function optionValue(tokens, index, optionName) {
  const value = tokens[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${optionName} requires a value`);
  }
  return value;
}

function inlineOptionValue(token, optionName) {
  const value = token.slice(`${optionName}=`.length);
  if (!value) throw new Error(`${optionName} requires a value`);
  return value;
}

function parseArgs(argv) {
  const separatorIndex = argv.indexOf('--');
  const launcherTokens = separatorIndex === -1 ? argv : argv.slice(0, separatorIndex);
  const meteorArgs = separatorIndex === -1 ? [] : argv.slice(separatorIndex + 1);
  const options = {
    appName: null,
    platform: null,
    meteorCheckout: null,
    expectedBranch: null,
    skipBranchCheck: false,
    skipInstall: false,
    skipLink: false,
    dryRun: false,
    help: false,
    meteorArgs,
  };
  const positionals = [];
  let forwardingMeteorArgs = false;

  for (let index = 0; index < launcherTokens.length; index += 1) {
    const token = launcherTokens[index];
    if (forwardingMeteorArgs) {
      options.meteorArgs.push(token);
    } else if (token === '--meteor-checkout') {
      options.meteorCheckout = optionValue(launcherTokens, index, token);
      index += 1;
    } else if (token.startsWith('--meteor-checkout=')) {
      options.meteorCheckout = inlineOptionValue(token, '--meteor-checkout');
    } else if (token === '--expected-branch') {
      options.expectedBranch = optionValue(launcherTokens, index, token);
      index += 1;
    } else if (token.startsWith('--expected-branch=')) {
      options.expectedBranch = inlineOptionValue(token, '--expected-branch');
    } else if (token === '--skip-branch-check') {
      options.skipBranchCheck = true;
    } else if (token === '--skip-install') {
      options.skipInstall = true;
    } else if (token === '--skip-link') {
      options.skipLink = true;
    } else if (token === '--dry-run') {
      options.dryRun = true;
    } else if (token === '--help' || token === '-h') {
      options.help = true;
    } else if (token.startsWith('-')) {
      if (positionals.length < 2) {
        throw new Error(`Meteor options must follow app and platform: ${token}`);
      }
      forwardingMeteorArgs = true;
      options.meteorArgs.push(token);
    } else {
      positionals.push(token);
    }
  }

  if (positionals.length > 2) {
    throw new Error(`Unexpected argument: ${positionals[2]}`);
  }
  options.appName = positionals[0] || null;
  options.platform = positionals[1] || null;

  if (options.help) return options;
  if (!options.appName) throw new Error('App is required');
  if (!options.platform) throw new Error('Platform is required');
  if (!PLATFORMS.has(options.platform)) {
    throw new Error(`Unsupported platform: ${options.platform}`);
  }

  return options;
}

function resolvePath(value, cwd) {
  return path.resolve(cwd, value);
}

function resolveRuntime(args, {
  cwd = process.cwd(),
  env = process.env,
  examplesRoot = EXAMPLES_ROOT,
} = {}) {
  let checkoutDir;
  let meteorBin;
  if (args.meteorCheckout) {
    checkoutDir = resolvePath(args.meteorCheckout, cwd);
    meteorBin = path.join(checkoutDir, 'meteor');
  } else if (env.METEOR_CHECKOUT) {
    checkoutDir = resolvePath(env.METEOR_CHECKOUT, cwd);
    meteorBin = env.METEOR_BIN
      ? resolvePath(env.METEOR_BIN, cwd)
      : path.join(checkoutDir, 'meteor');
  } else if (env.METEOR_BIN) {
    meteorBin = resolvePath(env.METEOR_BIN, cwd);
    checkoutDir = path.dirname(meteorBin);
  } else {
    checkoutDir = path.resolve(examplesRoot, '..', 'meteor');
    meteorBin = path.join(checkoutDir, 'meteor');
  }

  return {
    checkoutDir,
    meteorBin,
    expectedBranch: args.expectedBranch || env.METEOR_CAPACITOR_BRANCH || 'capacitor-integration',
    localPackageDirs: [
      path.join(checkoutDir, 'npm-packages', 'meteor-capacitor'),
      path.join(checkoutDir, 'npm-packages', 'meteor-rspack'),
    ],
  };
}

function hasPlatform(appDir, platform) {
  try {
    const platforms = fs.readFileSync(path.join(appDir, '.meteor', 'platforms'), 'utf8')
      .split(/\r?\n/)
      .map((value) => value.trim());
    return platforms.includes(platform);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function buildCommandPlan(args, runtime, app, {
  platformPresent,
  nativeProjectPresent,
}) {
  const plan = [];
  const appName = app.name || args.appName;
  if (!args.skipInstall) {
    const localPackageArgs = args.skipLink
      ? []
      : ['--no-save', '--package-lock=false', ...runtime.localPackageDirs];
    plan.push({
      label: 'install',
      command: runtime.meteorBin,
      args: ['npm', 'install', '--no-audit', '--no-fund', ...localPackageArgs],
      cwd: app.sourceDir,
    });
  }
  if (!args.skipLink) {
    plan.push({
      label: 'link',
      command: 'npm',
      args: ['link', '--no-save', ...runtime.localPackageDirs],
      cwd: app.sourceDir,
    });
  }
  if (!platformPresent) {
    plan.push({
      label: 'add-platform',
      command: runtime.meteorBin,
      args: ['add-platform', args.platform],
      cwd: app.sourceDir,
    });
  } else if (!nativeProjectPresent) {
    plan.push({
      label: 'prepare-capacitor-add',
      action: 'ensure-capacitor-web-dir',
      app,
      cwd: app.sourceDir,
      display: `prepare Capacitor web directory for ${appName}`,
    });
    plan.push({
      label: 'add-native-project',
      command: path.join(
        app.sourceDir,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'cap.cmd' : 'cap',
      ),
      args: ['add', args.platform],
      cwd: app.sourceDir,
      env: {
        METEOR_CAPACITOR_PLATFORM: args.platform,
      },
    });
  }
  plan.push({
    label: 'prepare-native',
    action: 'prepare-native',
    app,
    platform: args.platform,
    cwd: app.sourceDir,
    display: `prepare native settings for ${appName} ${args.platform}`,
  });
  plan.push({
    label: 'run',
    command: runtime.meteorBin,
    args: [
      'run',
      args.platform,
      ...args.meteorArgs,
    ],
    cwd: app.sourceDir,
  });
  return plan;
}

function quoteShell(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function formatCommand(step) {
  if (step.display) return step.display;
  return `cd ${quoteShell(step.cwd)} && ${[step.command, ...step.args].map(quoteShell).join(' ')}`;
}

function getCurrentBranch(checkoutDir, { spawnSyncImpl = spawnSync } = {}) {
  const result = spawnSyncImpl('git', ['-C', checkoutDir, 'branch', '--show-current'], {
    encoding: 'utf8',
  });
  if (result.error) {
    throw new Error(`Unable to inspect Meteor checkout branch: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const detail = String(result.stderr || '').trim();
    throw new Error(`Unable to inspect Meteor checkout branch${detail ? `: ${detail}` : ''}`);
  }
  return String(result.stdout || '').trim();
}

function validateRuntime(runtime, args, {
  getCurrentBranch: readCurrentBranch = getCurrentBranch,
} = {}) {
  if (!fs.existsSync(runtime.checkoutDir)) {
    throw new Error(`Meteor checkout not found: ${runtime.checkoutDir}`);
  }
  if (!fs.existsSync(runtime.meteorBin)) {
    throw new Error(`Meteor binary not found: ${runtime.meteorBin}`);
  }
  try {
    fs.accessSync(runtime.meteorBin, fs.constants.X_OK);
  } catch {
    throw new Error(`Meteor binary is not executable: ${runtime.meteorBin}`);
  }
  const checkoutRealPath = fs.realpathSync(runtime.checkoutDir);
  const binaryCheckoutRealPath = path.dirname(fs.realpathSync(runtime.meteorBin));
  if (binaryCheckoutRealPath !== checkoutRealPath) {
    throw new Error(
      `Meteor binary does not belong to checkout: ${runtime.meteorBin} ` +
      `(checkout: ${runtime.checkoutDir})`,
    );
  }
  if (!args.skipLink) {
    for (const packageDir of runtime.localPackageDirs) {
      if (!fs.existsSync(packageDir)) {
        throw new Error(`Local npm package not found: ${packageDir}`);
      }
    }
  }
  if (!args.skipBranchCheck) {
    const currentBranch = readCurrentBranch(runtime.checkoutDir);
    if (currentBranch !== runtime.expectedBranch) {
      const current = currentBranch || '(detached HEAD)';
      throw new Error(
        `Meteor checkout branch is ${current}; expected ${runtime.expectedBranch}. ` +
        'Switch checkout branches or pass --skip-branch-check.',
      );
    }
  }
}

async function spawnStep(step, {
  env = process.env,
  signalSource = process,
  spawnImpl = spawn,
} = {}) {
  if (step.action === 'ensure-capacitor-web-dir') {
    ensureCapacitorWebDir(step.app.sourceDir, { env });
    return { code: 0, signal: null };
  }
  if (step.action === 'prepare-native') {
    await prepareNativeProject(step.app, step.platform);
    return { code: 0, signal: null };
  }

  return new Promise((resolve, reject) => {
    const child = spawnImpl(step.command, step.args, {
      cwd: step.cwd,
      env: { ...env, ...step.env },
      stdio: 'inherit',
    });
    const forwardSigint = () => child.kill('SIGINT');
    const forwardSigterm = () => child.kill('SIGTERM');
    const cleanup = () => {
      signalSource.removeListener('SIGINT', forwardSigint);
      signalSource.removeListener('SIGTERM', forwardSigterm);
    };
    signalSource.once('SIGINT', forwardSigint);
    signalSource.once('SIGTERM', forwardSigterm);
    child.once('error', (error) => {
      cleanup();
      reject(error);
    });
    child.once('exit', (code, signal) => {
      cleanup();
      resolve({ code: typeof code === 'number' ? code : 1, signal: signal || null });
    });
  });
}

async function executePlan(plan, {
  dryRun = false,
  env = process.env,
  logger = console.log,
  runStep = spawnStep,
} = {}) {
  if (dryRun) {
    for (const step of plan) logger(formatCommand(step));
    return { code: 0, signal: null, step: null };
  }

  let lastResult = { code: 0, signal: null, step: null };
  for (const step of plan) {
    const result = await runStep(step, { env });
    lastResult = { ...result, step };
    if (result.code !== 0 || result.signal) return lastResult;
  }
  return lastResult;
}

function usage() {
  return `Usage:
  npm run run:native -- <app> <platform> [runner options] -- [meteor run options]
  npm run run:native:<app> -- <platform> [runner options] -- [meteor run options]

Apps: stock-scanner, civic-snap, meteor-drop
Platforms: android, ios

Runner options:
  --meteor-checkout <path>  Override adjacent Meteor checkout
  --expected-branch <name>  Override expected capacitor-integration branch
  --skip-branch-check       Allow an alternate or detached checkout
  --skip-install            Skip meteor npm install
  --skip-link               Skip local npm package linking
  --dry-run                 Print commands without running them
  --help, -h                Show this help

Environment:
  METEOR_CHECKOUT, METEOR_BIN, METEOR_CAPACITOR_BRANCH
  METEOR_CAPACITOR_MODE, METEOR_CAPACITOR_TARGET

Native runs use bundled development builds by default. Pass -- --production for a production build.
Unknown options after app and platform, or arguments after --, pass to meteor run.`;
}

function buildRunEnvironment(runtime, env) {
  return {
    ...env,
    PATH: `${path.dirname(runtime.meteorBin)}${path.delimiter}${env.PATH || ''}`,
    DO_NOT_TRACK: env.DO_NOT_TRACK || '1',
  };
}

async function run(argv = process.argv.slice(2), {
  cwd = process.cwd(),
  env = process.env,
  examplesRoot = EXAMPLES_ROOT,
  logger = console.log,
  errorLogger = console.error,
  getCurrentBranch: readCurrentBranch = getCurrentBranch,
  executor = executePlan,
} = {}) {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      logger(usage());
      return { code: 0, signal: null, step: null };
    }

    const app = getAppConfig(args.appName);
    if (!fs.existsSync(app.sourceDir)) {
      throw new Error(`Native example app not found: ${app.sourceDir}`);
    }
    const runtime = resolveRuntime(args, { cwd, env, examplesRoot });
    validateRuntime(runtime, args, { getCurrentBranch: readCurrentBranch });
    const plan = buildCommandPlan(args, runtime, app, {
      platformPresent: hasPlatform(app.sourceDir, args.platform),
      nativeProjectPresent: fs.existsSync(path.join(app.sourceDir, args.platform)),
    });

    return await executor(plan, {
      dryRun: args.dryRun,
      env: buildRunEnvironment(runtime, env),
      logger,
    });
  } catch (error) {
    errorLogger(error.message);
    return { code: 2, signal: null, step: null };
  }
}

if (require.main === module) {
  run().then((result) => {
    if (result.signal) {
      process.kill(process.pid, result.signal);
      return;
    }
    process.exitCode = result.code;
  });
}

module.exports = {
  buildCommandPlan,
  executePlan,
  formatCommand,
  getCurrentBranch,
  hasPlatform,
  parseArgs,
  resolveRuntime,
  run,
  spawnStep,
  usage,
  validateRuntime,
};
