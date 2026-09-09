const test = require('node:test');
const assert = require('node:assert/strict');
const { getDeviceId, getSpawnExitCode, parseArgs } = require('./run-flow');

test('parses native flow app and platform args', () => {
  assert.deepEqual(
    parseArgs(['--app=stock-scanner', '--platform=android']),
    { appName: 'stock-scanner', platform: 'android' }
  );
});

test('rejects missing app', () => {
  assert.throws(() => parseArgs(['--platform=android']), /--app is required/);
});

test('rejects unsupported platform', () => {
  assert.throws(
    () => parseArgs(['--app=stock-scanner', '--platform=web']),
    /Unsupported platform: web/
  );
});

test('fails when Maestro cannot be started', () => {
  assert.equal(
    getSpawnExitCode({ error: new Error('spawn maestro ENOENT'), status: null }, 'Maestro'),
    1
  );
});

test('fails when Maestro exits without a numeric status', () => {
  assert.equal(getSpawnExitCode({ signal: 'SIGTERM', status: null }, 'Maestro'), 1);
});

test('uses explicit Maestro device for any platform', () => {
  const previous = process.env.MAESTRO_DEVICE;
  process.env.MAESTRO_DEVICE = 'explicit-device';

  try {
    assert.equal(getDeviceId('ios'), 'explicit-device');
    assert.equal(getDeviceId('android'), 'explicit-device');
  } finally {
    if (previous === undefined) {
      delete process.env.MAESTRO_DEVICE;
    } else {
      process.env.MAESTRO_DEVICE = previous;
    }
  }
});

test('uses platform-specific Maestro device when set', () => {
  const previousIos = process.env.MAESTRO_IOS_DEVICE;
  const previousAndroid = process.env.MAESTRO_ANDROID_DEVICE;
  delete process.env.MAESTRO_DEVICE;
  process.env.MAESTRO_IOS_DEVICE = 'ios-device';
  process.env.MAESTRO_ANDROID_DEVICE = 'android-device';

  try {
    assert.equal(getDeviceId('ios'), 'ios-device');
    assert.equal(getDeviceId('android'), 'android-device');
  } finally {
    if (previousIos === undefined) {
      delete process.env.MAESTRO_IOS_DEVICE;
    } else {
      process.env.MAESTRO_IOS_DEVICE = previousIos;
    }

    if (previousAndroid === undefined) {
      delete process.env.MAESTRO_ANDROID_DEVICE;
    } else {
      process.env.MAESTRO_ANDROID_DEVICE = previousAndroid;
    }
  }
});
