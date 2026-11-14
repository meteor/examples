#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const { getAppConfig } = require('./app-config');

const PLATFORMS = new Set(['android', 'ios']);

function commandOutput(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) return '';
  return result.stdout || '';
}

function getSpawnExitCode(result, command) {
  if (result.error) {
    console.error(`Unable to start ${command}: ${result.error.message}`);
    return 1;
  }

  if (typeof result.status === 'number') return result.status;

  const reason = result.signal ? `signal ${result.signal}` : 'an unknown process error';
  console.error(`${command} stopped without an exit code (${reason}).`);
  return 1;
}

function parseArgs(argv) {
  const out = { appName: null, platform: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--app') {
      out.appName = argv[++i];
    } else if (token.startsWith('--app=')) {
      out.appName = token.slice('--app='.length);
    } else if (token === '--platform') {
      out.platform = argv[++i];
    } else if (token.startsWith('--platform=')) {
      out.platform = token.slice('--platform='.length);
    }
  }

  if (!out.appName) throw new Error('--app is required');
  if (!out.platform) throw new Error('--platform is required');
  if (!PLATFORMS.has(out.platform)) throw new Error(`Unsupported platform: ${out.platform}`);

  return out;
}

function findBootedIosDevice() {
  const output = commandOutput('xcrun', ['simctl', 'list', 'devices', 'booted']);
  const match = output.match(/\(([0-9A-F-]{36})\) \(Booted\)/i);
  return match?.[1] || null;
}

function findAndroidDevice() {
  const output = commandOutput('adb', ['devices']);
  const line = output
    .split('\n')
    .map((value) => value.trim())
    .find((value) => value.endsWith('\tdevice'));

  return line ? line.split('\t')[0] : null;
}

function getDeviceId(platform) {
  const envKey = platform === 'ios' ? 'MAESTRO_IOS_DEVICE' : 'MAESTRO_ANDROID_DEVICE';
  if (process.env.MAESTRO_DEVICE) return process.env.MAESTRO_DEVICE;
  if (process.env[envKey]) return process.env[envKey];

  if (platform === 'ios') {
    return process.env.METEOR_CAPACITOR_TARGET || findBootedIosDevice();
  }

  return process.env.ANDROID_SERIAL || findAndroidDevice();
}

function run(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    return 2;
  }

  const app = getAppConfig(args.appName);
  if (!fs.existsSync(app.flowPath)) {
    console.error(`Missing Maestro flow: ${app.flowPath}`);
    return 2;
  }

  const maestroArgs = ['test', '--platform', args.platform];
  const deviceId = getDeviceId(args.platform);
  if (deviceId) {
    maestroArgs.push('--device', deviceId);
  }
  maestroArgs.push(app.flowPath);

  const result = spawnSync('maestro', maestroArgs, {
    env: {
      ...process.env,
      MAESTRO_PLATFORM: args.platform,
    },
    stdio: 'inherit',
  });

  return getSpawnExitCode(result, 'Maestro');
}

if (require.main === module) {
  process.exitCode = run();
}

module.exports = {
  getDeviceId,
  getSpawnExitCode,
  parseArgs,
  run,
};
