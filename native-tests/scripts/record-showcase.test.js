const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  assertExternalOutputRoot,
  buildMaestroArgs,
  createOutputLayout,
  keepSuccessfulRun,
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
      keepRun: false,
      flowPath: null,
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
      keepRun: false,
      flowPath: null,
    }
  );
});

test('parses --keep-run for an add-only capture', () => {
  assert.equal(
    parseArgs([
      '--app=meteor-drop',
      '--platform=ios',
      '--output-dir=/tmp/native-showcase',
      '--keep-run',
    ]).keepRun,
    true
  );
});

test('parses a replacement showcase flow', () => {
  assert.equal(
    parseArgs([
      '--app=meteor-drop',
      '--platform=ios',
      '--output-dir=/tmp/native-showcase',
      '--flow=/tmp/meteor-drop-clean.yaml',
    ]).flowPath,
    '/tmp/meteor-drop-clean.yaml'
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

test('keeps a successful capture in its timestamped run without changing stable media', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'native-showcase-kept-'));
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-showcase-app-'));
  const showcaseFlowPath = path.join(sourceDir, 'showcase.yaml');
  fs.writeFileSync(showcaseFlowPath, 'appId: example\n---\n- launchApp\n');
  const appRoot = path.join(outputRoot, 'meteor-drop');
  const stableVideo = path.join(appRoot, 'videos', 'meteor-drop-ios.mp4');
  const stablePoster = path.join(appRoot, 'screenshots', 'meteor-drop-ios-poster.png');
  fs.mkdirSync(path.dirname(stableVideo), { recursive: true });
  fs.mkdirSync(path.dirname(stablePoster), { recursive: true });
  fs.writeFileSync(stableVideo, 'existing video');
  fs.writeFileSync(stablePoster, 'existing poster');
  const manifestPath = path.join(outputRoot, 'manifest.json');
  fs.writeFileSync(manifestPath, '{"existing":true}\n');

  const exitCode = run(
    ['--app=meteor-drop', '--platform=ios', `--output-dir=${outputRoot}`, '--keep-run'],
    {
      examplesRoot: '/work/meteor/examples',
      getAppConfig: () => ({
        name: 'meteor-drop',
        appName: 'Meteor Drop',
        mediaSlug: 'meteor-drop',
        showcaseFlowPath,
      }),
      getDeviceId: () => 'IPHONE-15-PRO',
      now: () => new Date('2026-07-30T15:04:05.006Z'),
      spawnSync: (_command, args) => {
        const videoArg = args.find(value => value.startsWith('SHOWCASE_VIDEO_PATH='));
        const posterArg = args.find(value => value.startsWith('SHOWCASE_POSTER_PATH='));
        fs.writeFileSync(`${videoArg.slice('SHOWCASE_VIDEO_PATH='.length)}.mp4`, 'new video');
        fs.writeFileSync(`${posterArg.slice('SHOWCASE_POSTER_PATH='.length)}.png`, 'new poster');
        return { status: 0 };
      },
    }
  );

  assert.equal(exitCode, 0);
  assert.equal(fs.readFileSync(stableVideo, 'utf8'), 'existing video');
  assert.equal(fs.readFileSync(stablePoster, 'utf8'), 'existing poster');
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), '{"existing":true}\n');
  const runDir = path.join(appRoot, 'runs', '2026-07-30T15-04-05-006Z-ios');
  assert.equal(fs.readFileSync(path.join(runDir, 'meteor-drop-ios.mp4'), 'utf8'), 'new video');
  assert.equal(fs.readFileSync(path.join(runDir, 'meteor-drop-ios-poster.png'), 'utf8'), 'new poster');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8')), {
    status: 'passed',
    app: 'meteor-drop',
    platform: 'ios',
    deviceId: 'IPHONE-15-PRO',
    completedAt: '2026-07-30T15:04:05.006Z',
    retained: true,
  });
});
