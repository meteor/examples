const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  assertExternalOutputRoot,
  buildMaestroArgs,
  createOutputLayout,
  parseArgs,
  promoteSuccessfulRun,
  run,
} = require('./record-showcase');

test('parses app, platform, and explicit output directory', () => {
  assert.deepEqual(
    parseArgs([
      '--app=stock-scanner',
      '--platform=ios',
      '--output-dir=/tmp/native-showcase',
    ]),
    {
      appName: 'stock-scanner',
      platform: 'ios',
      outputDir: '/tmp/native-showcase',
    }
  );
});

test('uses the external showcase environment variable', () => {
  assert.deepEqual(
    parseArgs(['--app', 'meteor-drop', '--platform', 'android'], {
      NATIVE_SHOWCASE_OUTPUT_DIR: '/tmp/showcase-library',
    }),
    {
      appName: 'meteor-drop',
      platform: 'android',
      outputDir: '/tmp/showcase-library',
    }
  );
});

test('requires an output directory', () => {
  assert.throws(
    () => parseArgs(['--app=meteor-drop', '--platform=ios'], {}),
    /--output-dir or NATIVE_SHOWCASE_OUTPUT_DIR is required/
  );
});

test('rejects output paths inside the examples checkout', () => {
  const examplesRoot = '/work/meteor/examples';
  assert.throws(
    () => assertExternalOutputRoot('/work/meteor/examples/showcase', examplesRoot),
    /must be outside the examples checkout/
  );
  assert.doesNotThrow(() =>
    assertExternalOutputRoot('/work/promotion/native-showcase', examplesRoot)
  );
});

test('creates stable and timestamped media paths', () => {
  const layout = createOutputLayout({
    outputRoot: '/media/native-app-showcase',
    mediaSlug: 'meteor-drop',
    platform: 'ios',
    now: new Date('2026-07-22T15:04:05.006Z'),
  });

  assert.equal(
    layout.runDir,
    '/media/native-app-showcase/meteor-drop/runs/2026-07-22T15-04-05-006Z-ios'
  );
  assert.equal(layout.runVideoPath, `${layout.runDir}/meteor-drop-ios.mp4`);
  assert.equal(layout.runPosterPath, `${layout.runDir}/meteor-drop-ios-poster.png`);
  assert.equal(layout.showcaseRunId, 'MRW7QIDQ');
  assert.equal(
    layout.videoPath,
    '/media/native-app-showcase/meteor-drop/videos/meteor-drop-ios.mp4'
  );
  assert.equal(
    layout.posterPath,
    '/media/native-app-showcase/meteor-drop/screenshots/meteor-drop-ios-poster.png'
  );
});

test('builds a targeted Maestro command with external recording variables', () => {
  const args = buildMaestroArgs({
    platform: 'ios',
    deviceId: 'SIMULATOR-ID',
    flowPath: '/repo/native-tests/flows/showcase/meteor-drop.yaml',
    runDir: '/media/meteor-drop/runs/run-id',
    showcaseRunId: 'ABC123',
    videoBasePath: '/media/meteor-drop/runs/run-id/meteor-drop-ios',
    posterBasePath: '/media/meteor-drop/runs/run-id/meteor-drop-ios-poster',
  });

  assert.deepEqual(args, [
    'test',
    '--platform',
    'ios',
    '--device',
    'SIMULATOR-ID',
    '--format',
    'junit',
    '--output',
    '/media/meteor-drop/runs/run-id/maestro-report.xml',
    '--debug-output',
    '/media/meteor-drop/runs/run-id/debug',
    '--test-output-dir',
    '/media/meteor-drop/runs/run-id/test-output',
    '-e',
    'SHOWCASE_VIDEO_PATH=/media/meteor-drop/runs/run-id/meteor-drop-ios',
    '-e',
    'SHOWCASE_POSTER_PATH=/media/meteor-drop/runs/run-id/meteor-drop-ios-poster',
    '-e',
    'SHOWCASE_RUN_ID=ABC123',
    '/repo/native-tests/flows/showcase/meteor-drop.yaml',
  ]);
});

test('promotes a successful run and updates the external manifest', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'native-showcase-'));
  const layout = createOutputLayout({
    outputRoot,
    mediaSlug: 'meteor-drop',
    platform: 'ios',
    now: new Date('2026-07-22T15:04:05.006Z'),
  });
  fs.mkdirSync(layout.runDir, { recursive: true });
  fs.writeFileSync(layout.runVideoPath, 'video');
  fs.writeFileSync(layout.runPosterPath, 'poster');

  promoteSuccessfulRun({
    layout,
    app: { name: 'meteor-drop', appName: 'Meteor Drop', mediaSlug: 'meteor-drop' },
    platform: 'ios',
    deviceId: 'SIMULATOR-ID',
    completedAt: new Date('2026-07-22T15:05:00.000Z'),
  });

  assert.equal(fs.readFileSync(layout.videoPath, 'utf8'), 'video');
  assert.equal(fs.readFileSync(layout.posterPath, 'utf8'), 'poster');

  const manifest = JSON.parse(fs.readFileSync(path.join(outputRoot, 'manifest.json'), 'utf8'));
  assert.equal(manifest.apps['meteor-drop'].platforms.ios.deviceId, 'SIMULATOR-ID');
  assert.equal(manifest.apps['meteor-drop'].platforms.ios.video, 'meteor-drop/videos/meteor-drop-ios.mp4');
  assert.equal(
    manifest.apps['meteor-drop'].platforms.ios.poster,
    'meteor-drop/screenshots/meteor-drop-ios-poster.png'
  );
});

test('does not replace stable media or create a manifest after a failed run', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'native-showcase-failure-'));
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-showcase-app-'));
  const showcaseFlowPath = path.join(sourceDir, 'showcase.yaml');
  fs.writeFileSync(showcaseFlowPath, 'appId: example\n---\n- launchApp\n');

  const exitCode = run(
    ['--app=meteor-drop', '--platform=ios', `--output-dir=${outputRoot}`],
    {
      examplesRoot: '/work/meteor/examples',
      getAppConfig: () => ({
        name: 'meteor-drop',
        appName: 'Meteor Drop',
        mediaSlug: 'meteor-drop',
        showcaseFlowPath,
      }),
      getDeviceId: () => 'SIMULATOR-ID',
      now: () => new Date('2026-07-22T15:04:05.006Z'),
      spawnSync: () => ({ status: 1, stdout: 'flow failed', stderr: 'assertion failed' }),
    }
  );

  assert.equal(exitCode, 1);
  assert.equal(fs.existsSync(path.join(outputRoot, 'manifest.json')), false);
  assert.equal(
    fs.existsSync(path.join(outputRoot, 'meteor-drop', 'videos', 'meteor-drop-ios.mp4')),
    false
  );

  const runResultPath = path.join(
    outputRoot,
    'meteor-drop',
    'runs',
    '2026-07-22T15-04-05-006Z-ios',
    'run.json'
  );
  const runResult = JSON.parse(fs.readFileSync(runResultPath, 'utf8'));
  assert.equal(runResult.status, 'failed');
});
