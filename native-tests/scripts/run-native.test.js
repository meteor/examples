const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const {
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
} = require('./run-native');

function createCheckout() {
  const checkoutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-run-checkout-'));
  const meteorBin = path.join(checkoutDir, 'meteor');
  const localPackageDirs = [
    path.join(checkoutDir, 'npm-packages', 'meteor-capacitor'),
    path.join(checkoutDir, 'npm-packages', 'meteor-rspack'),
  ];
  fs.writeFileSync(meteorBin, '#!/bin/sh\n');
  fs.chmodSync(meteorBin, 0o755);
  for (const packageDir of localPackageDirs) {
    fs.mkdirSync(packageDir, { recursive: true });
  }
  return {
    checkoutDir,
    meteorBin,
    expectedBranch: 'capacitor-integration',
    localPackageDirs,
  };
}

test('parses app, platform, runner options, and Meteor passthrough', () => {
  assert.deepEqual(parseArgs([
    'meteor-escape',
    'ios',
    '--skip-install',
    '--',
    '--port',
    '3100',
    '--production',
  ]), {
    appName: 'meteor-escape',
    platform: 'ios',
    meteorCheckout: null,
    expectedBranch: null,
    skipBranchCheck: false,
    skipInstall: true,
    skipLink: false,
    development: false,
    dryRun: false,
    help: false,
    meteorArgs: ['--port', '3100', '--production'],
  });
});

test('parses app-specific command arguments', () => {
  const args = parseArgs([
    'civic-snap',
    'android',
    '--skip-link',
    '--development',
  ]);
  assert.equal(args.appName, 'civic-snap');
  assert.equal(args.platform, 'android');
  assert.equal(args.skipLink, true);
  assert.equal(args.development, true);
});

test('forwards Meteor options when npm consumes the passthrough separator', () => {
  const args = parseArgs([
    'meteor-escape',
    'android',
    '--mobile-server',
    'http://10.0.2.2:3000',
    '--port',
    '3199',
  ]);

  assert.deepEqual(args.meteorArgs, [
    '--mobile-server',
    'http://10.0.2.2:3000',
    '--port',
    '3199',
  ]);
});

test('parses checkout and branch option values', () => {
  const args = parseArgs([
    'stock-scanner',
    'ios',
    '--meteor-checkout',
    '../meteor-feature',
    '--expected-branch=feature/capacitor',
    '--skip-branch-check',
    '--dry-run',
  ]);

  assert.equal(args.meteorCheckout, '../meteor-feature');
  assert.equal(args.expectedBranch, 'feature/capacitor');
  assert.equal(args.skipBranchCheck, true);
  assert.equal(args.dryRun, true);
});

test('allows help without app or platform', () => {
  const args = parseArgs(['--help']);
  assert.equal(args.help, true);
  assert.equal(args.appName, null);
  assert.equal(args.platform, null);
});

test('rejects missing and malformed launcher arguments', () => {
  assert.throws(() => parseArgs(['stock-scanner']), /Platform is required/);
  assert.throws(() => parseArgs(['missing', 'web']), /Unsupported platform: web/);
  assert.throws(
    () => parseArgs(['stock-scanner', '--port', '3100']),
    /Meteor options must follow app and platform/
  );
  assert.throws(() => parseArgs(['stock-scanner', 'ios', 'extra']), /Unexpected argument: extra/);
  assert.throws(() => parseArgs(['stock-scanner', 'ios', '--meteor-checkout']), /requires a value/);
  assert.throws(() => parseArgs(['stock-scanner', 'ios', '--meteor-checkout=']), /requires a value/);
  assert.throws(() => parseArgs(['stock-scanner', 'ios', '--expected-branch=']), /requires a value/);
});

test('resolves runtime options with CLI then environment precedence', () => {
  const cwd = path.join(path.sep, 'workspace', 'examples');
  const args = parseArgs([
    'stock-scanner',
    'android',
    '--meteor-checkout',
    '../meteor-cli',
    '--expected-branch',
    'cli-branch',
  ]);
  const runtime = resolveRuntime(args, {
    cwd,
    examplesRoot: cwd,
    env: {
      METEOR_CHECKOUT: '/meteor-env',
      METEOR_BIN: '/custom/meteor',
      METEOR_CAPACITOR_BRANCH: 'env-branch',
    },
  });

  assert.equal(runtime.checkoutDir, path.join(path.sep, 'workspace', 'meteor-cli'));
  assert.equal(runtime.meteorBin, path.join(path.sep, 'workspace', 'meteor-cli', 'meteor'));
  assert.equal(runtime.expectedBranch, 'cli-branch');
  assert.deepEqual(runtime.localPackageDirs, [
    path.join(path.sep, 'workspace', 'meteor-cli', 'npm-packages', 'meteor-capacitor'),
    path.join(path.sep, 'workspace', 'meteor-cli', 'npm-packages', 'meteor-rspack'),
  ]);
});

test('derives checkout from METEOR_BIN when no checkout override exists', () => {
  const runtime = resolveRuntime(parseArgs(['stock-scanner', 'ios']), {
    cwd: '/workspace/examples',
    examplesRoot: '/workspace/examples',
    env: { METEOR_BIN: '../meteor-feature/meteor' },
  });

  assert.equal(runtime.meteorBin, '/workspace/meteor-feature/meteor');
  assert.equal(runtime.checkoutDir, '/workspace/meteor-feature');
  assert.equal(runtime.localPackageDirs[0], '/workspace/meteor-feature/npm-packages/meteor-capacitor');
});

test('resolves adjacent checkout defaults', () => {
  const examplesRoot = path.join(path.sep, 'repo', 'examples');
  const runtime = resolveRuntime(parseArgs(['meteor-escape', 'ios']), {
    cwd: examplesRoot,
    examplesRoot,
    env: {},
  });

  assert.equal(runtime.checkoutDir, path.join(path.sep, 'repo', 'meteor'));
  assert.equal(runtime.meteorBin, path.join(path.sep, 'repo', 'meteor', 'meteor'));
  assert.equal(runtime.expectedBranch, 'capacitor-integration');
});

test('detects configured Meteor platforms', () => {
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-run-platforms-'));
  fs.mkdirSync(path.join(appDir, '.meteor'));
  fs.writeFileSync(path.join(appDir, '.meteor', 'platforms'), 'server\nbrowser\nios\n');

  assert.equal(hasPlatform(appDir, 'ios'), true);
  assert.equal(hasPlatform(appDir, 'android'), false);
});

test('builds setup and native run commands with passthrough', () => {
  const args = parseArgs(['meteor-escape', 'android', '--', '--port', '3199']);
  const runtime = {
    meteorBin: '/repo/meteor/meteor',
    localPackageDirs: ['/repo/meteor/capacitor', '/repo/meteor/rspack'],
  };
  const app = { sourceDir: '/repo/examples/meteor-escape' };

  assert.deepEqual(buildCommandPlan(args, runtime, app, {
    platformPresent: false,
    nativeProjectPresent: false,
  }), [
    {
      label: 'install',
      command: '/repo/meteor/meteor',
      args: [
        'npm',
        'install',
        '--no-audit',
        '--no-fund',
        '--no-save',
        '--package-lock=false',
        '/repo/meteor/capacitor',
        '/repo/meteor/rspack',
      ],
      cwd: app.sourceDir,
    },
    {
      label: 'link',
      command: 'npm',
      args: ['link', '--no-save', '/repo/meteor/capacitor', '/repo/meteor/rspack'],
      cwd: app.sourceDir,
    },
    {
      label: 'add-platform',
      command: '/repo/meteor/meteor',
      args: ['add-platform', 'android'],
      cwd: app.sourceDir,
    },
    {
      label: 'prepare-native',
      action: 'prepare-native',
      app,
      platform: 'android',
      cwd: app.sourceDir,
      display: 'prepare native settings for meteor-escape android',
    },
    {
      label: 'run',
      command: '/repo/meteor/meteor',
      args: ['run', 'android', '--production', '--port', '3199'],
      cwd: app.sourceDir,
    },
  ]);
});

test('keeps explicit production flags singular and supports development mode', () => {
  const runtime = {
    meteorBin: '/repo/meteor/meteor',
    localPackageDirs: [],
  };
  const app = { sourceDir: '/repo/examples/meteor-escape' };
  const buildRun = (tokens) => {
    const plan = buildCommandPlan(
      parseArgs(['meteor-escape', 'android', '--skip-install', '--skip-link', ...tokens]),
      runtime,
      app,
      { platformPresent: true, nativeProjectPresent: true }
    );
    return plan.at(-1).args;
  };

  assert.deepEqual(
    buildRun(['--', '--production', '--port', '3199']),
    ['run', 'android', '--production', '--port', '3199']
  );
  assert.deepEqual(
    buildRun(['--development', '--', '--port', '3199']),
    ['run', 'android', '--port', '3199']
  );
});

test('skips optional setup commands and quotes dry-run output', () => {
  const args = parseArgs(['stock-scanner', 'ios', '--skip-install', '--skip-link']);
  const app = { sourceDir: '/repo/examples/Stock Scanner' };
  const plan = buildCommandPlan(args, {
    meteorBin: '/repo/Meteor Checkout/meteor',
    localPackageDirs: [],
  }, app, { platformPresent: true, nativeProjectPresent: true });

  assert.equal(plan.length, 2);
  assert.equal(
    formatCommand(plan[1]),
    "cd '/repo/examples/Stock Scanner' && '/repo/Meteor Checkout/meteor' run ios --production",
  );
});

test('scaffolds missing native project before applying settings', () => {
  const args = parseArgs(['civic-snap', 'ios', '--skip-install', '--skip-link']);
  const app = { name: 'city-issue-reporter', sourceDir: '/repo/examples/city-issue-reporter' };
  const plan = buildCommandPlan(args, {
    meteorBin: '/repo/meteor/meteor',
    localPackageDirs: [],
  }, app, { platformPresent: true, nativeProjectPresent: false });

  assert.deepEqual(plan.slice(0, 3), [
    {
      label: 'prepare-capacitor-add',
      action: 'ensure-capacitor-web-dir',
      app,
      cwd: app.sourceDir,
      display: 'prepare Capacitor web directory for city-issue-reporter',
    },
    {
      label: 'add-native-project',
      command: path.join(app.sourceDir, 'node_modules', '.bin', 'cap'),
      args: ['add', 'ios'],
      cwd: app.sourceDir,
      env: { METEOR_CAPACITOR_PLATFORM: 'ios' },
    },
    {
      label: 'prepare-native',
      action: 'prepare-native',
      app,
      platform: 'ios',
      cwd: app.sourceDir,
      display: 'prepare native settings for city-issue-reporter ios',
    },
  ]);
});

test('validates checkout files and expected branch', () => {
  const runtime = createCheckout();
  const args = parseArgs(['stock-scanner', 'ios']);

  assert.doesNotThrow(() => validateRuntime(runtime, args, {
    getCurrentBranch: () => 'capacitor-integration',
  }));
  assert.throws(
    () => validateRuntime(runtime, args, { getCurrentBranch: () => 'main' }),
    /Meteor checkout branch is main; expected capacitor-integration/,
  );
});

test('allows intentional branch-check bypass', () => {
  const runtime = createCheckout();
  const args = parseArgs(['stock-scanner', 'ios', '--skip-branch-check']);
  let branchRead = false;

  validateRuntime(runtime, args, {
    getCurrentBranch: () => {
      branchRead = true;
      return 'main';
    },
  });

  assert.equal(branchRead, false);
});

test('reports missing checkout runtime paths', () => {
  const runtime = createCheckout();
  const args = parseArgs(['stock-scanner', 'ios']);

  fs.rmSync(runtime.meteorBin);
  assert.throws(
    () => validateRuntime(runtime, args, { getCurrentBranch: () => 'capacitor-integration' }),
    new RegExp(`Meteor binary not found: ${runtime.meteorBin}`),
  );

  fs.writeFileSync(runtime.meteorBin, '#!/bin/sh\n');
  fs.chmodSync(runtime.meteorBin, 0o755);
  fs.rmSync(runtime.localPackageDirs[0], { recursive: true });
  assert.throws(
    () => validateRuntime(runtime, args, { getCurrentBranch: () => 'capacitor-integration' }),
    /Local npm package not found:.*meteor-capacitor/,
  );
});

test('rejects Meteor binary from a different checkout', () => {
  const runtime = createCheckout();
  const otherCheckout = createCheckout();
  runtime.meteorBin = otherCheckout.meteorBin;

  assert.throws(
    () => validateRuntime(runtime, parseArgs(['stock-scanner', 'ios']), {
      getCurrentBranch: () => 'capacitor-integration',
    }),
    /Meteor binary does not belong to checkout/,
  );
});

test('does not require local package paths when linking is skipped', () => {
  const runtime = createCheckout();
  fs.rmSync(path.join(runtime.checkoutDir, 'npm-packages'), { recursive: true });
  const args = parseArgs(['stock-scanner', 'ios', '--skip-link']);

  assert.doesNotThrow(() => validateRuntime(runtime, args, {
    getCurrentBranch: () => 'capacitor-integration',
  }));
});

test('reads current checkout branch through Git', () => {
  const calls = [];
  const branch = getCurrentBranch('/repo/meteor', {
    spawnSyncImpl(command, args) {
      calls.push([command, args]);
      return { status: 0, stdout: 'capacitor-integration\n' };
    },
  });

  assert.equal(branch, 'capacitor-integration');
  assert.deepEqual(calls, [['git', ['-C', '/repo/meteor', 'branch', '--show-current']]]);
});

test('executes commands in order and returns final status', async () => {
  const plan = [
    { label: 'install', command: 'meteor', args: ['npm', 'install'], cwd: '/app' },
    { label: 'run', command: 'meteor', args: ['run', 'ios'], cwd: '/app' },
  ];
  const calls = [];
  const result = await executePlan(plan, {
    runStep: async (step) => {
      calls.push(step.label);
      return { code: 0, signal: null };
    },
  });

  assert.deepEqual(calls, ['install', 'run']);
  assert.deepEqual(result, { code: 0, signal: null, step: plan[1] });
});

test('stops command execution after first failure', async () => {
  const plan = [
    { label: 'install', command: 'meteor', args: [], cwd: '/app' },
    { label: 'link', command: 'npm', args: [], cwd: '/app' },
  ];
  const calls = [];
  const result = await executePlan(plan, {
    runStep: async (step) => {
      calls.push(step.label);
      return { code: 7, signal: null };
    },
  });

  assert.deepEqual(calls, ['install']);
  assert.deepEqual(result, { code: 7, signal: null, step: plan[0] });
});

test('forwards launcher termination to active child and removes listeners', async () => {
  const signalSource = new EventEmitter();
  const child = new EventEmitter();
  const forwarded = [];
  child.kill = (signal) => {
    forwarded.push(signal);
    return true;
  };
  const resultPromise = spawnStep({
    command: 'meteor',
    args: ['run', 'ios'],
    cwd: '/app',
  }, {
    signalSource,
    spawnImpl: () => child,
  });

  signalSource.emit('SIGTERM');
  assert.deepEqual(forwarded, ['SIGTERM']);
  child.emit('exit', null, 'SIGTERM');

  assert.deepEqual(await resultPromise, { code: 1, signal: 'SIGTERM' });
  assert.equal(signalSource.listenerCount('SIGINT'), 0);
  assert.equal(signalSource.listenerCount('SIGTERM'), 0);
});

test('dry-run prints plan without starting processes', async () => {
  const logs = [];
  const plan = [{ label: 'run', command: '/repo/meteor', args: ['run', 'ios'], cwd: '/repo/app' }];
  const result = await executePlan(plan, {
    dryRun: true,
    logger: (message) => logs.push(message),
    runStep: async () => {
      throw new Error('must not run');
    },
  });

  assert.deepEqual(result, { code: 0, signal: null, step: null });
  assert.deepEqual(logs, ['cd /repo/app && /repo/meteor run ios']);
});

test('prints complete launcher usage', () => {
  const output = usage();
  assert.match(output, /run:native -- <app> <platform>/);
  assert.match(output, /stock-scanner.*civic-snap.*meteor-escape/s);
  assert.match(output, /--meteor-checkout/);
  assert.match(output, /--development/);
  assert.match(output, /METEOR_CAPACITOR_MODE/);
  assert.match(output, /Unknown options after app and platform/);
});

test('runs resolved app plan in dry-run mode', async () => {
  const runtime = createCheckout();
  const logs = [];
  const errors = [];
  const result = await run([
    'meteor-escape',
    'ios',
    '--meteor-checkout',
    runtime.checkoutDir,
    '--skip-install',
    '--skip-link',
    '--dry-run',
    '--',
    '--port',
    '3199',
  ], {
    env: {},
    getCurrentBranch: () => 'capacitor-integration',
    logger: (message) => logs.push(message),
    errorLogger: (message) => errors.push(message),
  });

  assert.equal(result.code, 0);
  assert.deepEqual(errors, []);
  assert.match(logs.join('\n'), /meteor run ios --production --port 3199/);
});

test('returns usage error for unknown app', async () => {
  const errors = [];
  const result = await run(['missing', 'ios'], {
    errorLogger: (message) => errors.push(message),
  });

  assert.equal(result.code, 2);
  assert.match(errors.join('\n'), /Unknown native example app: missing/);
});

test('exposes generic and app-specific npm launcher commands', () => {
  const scripts = require('../../package.json').scripts;
  assert.equal(scripts['run:native'], 'node native-tests/scripts/run-native.js');
  assert.equal(
    scripts['run:native:stock-scanner'],
    'node native-tests/scripts/run-native.js stock-scanner',
  );
  assert.equal(
    scripts['run:native:civic-snap'],
    'node native-tests/scripts/run-native.js civic-snap',
  );
  assert.equal(
    scripts['run:native:meteor-escape'],
    'node native-tests/scripts/run-native.js meteor-escape',
  );
});
