#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { getAppConfig } = require('./app-config');
const { getDeviceId, getSpawnExitCode } = require('./run-flow');

const EXAMPLES_ROOT = path.resolve(__dirname, '..', '..');
const PLATFORMS = new Set(['android', 'ios']);

function parseArgs(argv, env = process.env) {
  const out = {
    appName: null,
    platform: null,
    outputDir: env.NATIVE_SHOWCASE_OUTPUT_DIR || null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--app') {
      out.appName = argv[++index];
    } else if (token.startsWith('--app=')) {
      out.appName = token.slice('--app='.length);
    } else if (token === '--platform') {
      out.platform = argv[++index];
    } else if (token.startsWith('--platform=')) {
      out.platform = token.slice('--platform='.length);
    } else if (token === '--output-dir') {
      out.outputDir = argv[++index];
    } else if (token.startsWith('--output-dir=')) {
      out.outputDir = token.slice('--output-dir='.length);
    }
  }

  if (!out.appName) throw new Error('--app is required');
  if (!out.platform) throw new Error('--platform is required');
  if (!PLATFORMS.has(out.platform)) throw new Error(`Unsupported platform: ${out.platform}`);
  if (!out.outputDir) {
    throw new Error('--output-dir or NATIVE_SHOWCASE_OUTPUT_DIR is required');
  }

  return out;
}

function isInside(candidate, parent) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..');
}

function assertExternalOutputRoot(outputRoot, examplesRoot = EXAMPLES_ROOT) {
  if (isInside(outputRoot, examplesRoot)) {
    throw new Error('Showcase output directory must be outside the examples checkout');
  }
}

function timestampForPath(now) {
  return now.toISOString().replace(/[:.]/g, '-');
}

function createOutputLayout({ outputRoot, mediaSlug, platform, now = new Date() }) {
  const root = path.resolve(outputRoot);
  const appRoot = path.join(root, mediaSlug);
  const runId = `${timestampForPath(now)}-${platform}`;
  const runDir = path.join(appRoot, 'runs', runId);
  const fileStem = `${mediaSlug}-${platform}`;

  return {
    outputRoot: root,
    appRoot,
    runId,
    showcaseRunId: now.getTime().toString(36).toUpperCase(),
    runDir,
    runVideoBasePath: path.join(runDir, fileStem),
    runVideoPath: path.join(runDir, `${fileStem}.mp4`),
    runPosterBasePath: path.join(runDir, `${fileStem}-poster`),
    runPosterPath: path.join(runDir, `${fileStem}-poster.png`),
    videosDir: path.join(appRoot, 'videos'),
    screenshotsDir: path.join(appRoot, 'screenshots'),
    videoPath: path.join(appRoot, 'videos', `${fileStem}.mp4`),
    posterPath: path.join(appRoot, 'screenshots', `${fileStem}-poster.png`),
  };
}

function buildMaestroArgs({
  platform,
  deviceId,
  flowPath,
  runDir,
  showcaseRunId,
  videoBasePath,
  posterBasePath,
}) {
  const args = ['test', '--platform', platform];
  if (deviceId) args.push('--device', deviceId);

  args.push(
    '--format',
    'junit',
    '--output',
    path.join(runDir, 'maestro-report.xml'),
    '--debug-output',
    path.join(runDir, 'debug'),
    '--test-output-dir',
    path.join(runDir, 'test-output'),
    '-e',
    `SHOWCASE_VIDEO_PATH=${videoBasePath}`,
    '-e',
    `SHOWCASE_POSTER_PATH=${posterBasePath}`,
    '-e',
    `SHOWCASE_RUN_ID=${showcaseRunId}`,
    flowPath
  );

  return args;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function replaceFile(sourcePath, destinationPath) {
  const temporaryPath = `${destinationPath}.tmp`;
  fs.copyFileSync(sourcePath, temporaryPath);
  fs.renameSync(temporaryPath, destinationPath);
}

function relativeMediaPath(outputRoot, filePath) {
  return path.relative(outputRoot, filePath).split(path.sep).join('/');
}

function promoteSuccessfulRun({ layout, app, platform, deviceId, completedAt = new Date() }) {
  if (!fs.existsSync(layout.runVideoPath) || !fs.existsSync(layout.runPosterPath)) {
    throw new Error('Maestro completed without producing both showcase media files');
  }

  fs.mkdirSync(layout.videosDir, { recursive: true });
  fs.mkdirSync(layout.screenshotsDir, { recursive: true });
  replaceFile(layout.runVideoPath, layout.videoPath);
  replaceFile(layout.runPosterPath, layout.posterPath);

  const manifestPath = path.join(layout.outputRoot, 'manifest.json');
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : { schemaVersion: 1, apps: {} };
  const completedAtIso = completedAt.toISOString();

  manifest.updatedAt = completedAtIso;
  manifest.apps[app.mediaSlug] = manifest.apps[app.mediaSlug] || {
    name: app.name,
    appName: app.appName,
    platforms: {},
  };
  manifest.apps[app.mediaSlug].platforms[platform] = {
    capturedAt: completedAtIso,
    deviceId: deviceId || null,
    video: relativeMediaPath(layout.outputRoot, layout.videoPath),
    poster: relativeMediaPath(layout.outputRoot, layout.posterPath),
    run: relativeMediaPath(layout.outputRoot, layout.runDir),
  };

  const temporaryManifestPath = `${manifestPath}.tmp`;
  writeJson(temporaryManifestPath, manifest);
  fs.renameSync(temporaryManifestPath, manifestPath);
  writeJson(path.join(layout.runDir, 'run.json'), {
    status: 'passed',
    app: app.name,
    platform,
    deviceId: deviceId || null,
    completedAt: completedAtIso,
  });
}

function writeFailedRun({ layout, app, platform, deviceId, exitCode, error, completedAt }) {
  writeJson(path.join(layout.runDir, 'run.json'), {
    status: 'failed',
    app: app.name,
    platform,
    deviceId: deviceId || null,
    exitCode,
    error: error || null,
    completedAt: completedAt.toISOString(),
  });
}

function run(argv = process.argv.slice(2), dependencies = {}) {
  const env = dependencies.env || process.env;
  const now = dependencies.now || (() => new Date());
  const spawn = dependencies.spawnSync || spawnSync;
  const lookupApp = dependencies.getAppConfig || getAppConfig;
  const lookupDevice = dependencies.getDeviceId || getDeviceId;
  const examplesRoot = dependencies.examplesRoot || EXAMPLES_ROOT;

  let args;
  let app;
  try {
    args = parseArgs(argv, env);
    assertExternalOutputRoot(args.outputDir, examplesRoot);
    app = lookupApp(args.appName);
  } catch (error) {
    console.error(error.message);
    return 2;
  }

  if (!fs.existsSync(app.showcaseFlowPath)) {
    console.error(`Missing Maestro showcase flow: ${app.showcaseFlowPath}`);
    return 2;
  }

  const startedAt = now();
  const layout = createOutputLayout({
    outputRoot: args.outputDir,
    mediaSlug: app.mediaSlug,
    platform: args.platform,
    now: startedAt,
  });
  fs.mkdirSync(layout.runDir, { recursive: true });

  const deviceId = lookupDevice(args.platform);
  const maestroArgs = buildMaestroArgs({
    platform: args.platform,
    deviceId,
    flowPath: app.showcaseFlowPath,
    runDir: layout.runDir,
    showcaseRunId: layout.showcaseRunId,
    videoBasePath: layout.runVideoBasePath,
    posterBasePath: layout.runPosterBasePath,
  });
  const result = spawn('maestro', maestroArgs, {
    encoding: 'utf8',
    env: { ...env, MAESTRO_PLATFORM: args.platform },
  });

  if (result.stdout) {
    fs.writeFileSync(path.join(layout.runDir, 'maestro.stdout.log'), result.stdout);
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    fs.writeFileSync(path.join(layout.runDir, 'maestro.stderr.log'), result.stderr);
    process.stderr.write(result.stderr);
  }

  const exitCode = getSpawnExitCode(result, 'Maestro');
  if (exitCode !== 0) {
    writeFailedRun({
      layout,
      app,
      platform: args.platform,
      deviceId,
      exitCode,
      error: result.error?.message,
      completedAt: now(),
    });
    return exitCode;
  }

  try {
    promoteSuccessfulRun({
      layout,
      app,
      platform: args.platform,
      deviceId,
      completedAt: now(),
    });
  } catch (error) {
    console.error(error.message);
    writeFailedRun({
      layout,
      app,
      platform: args.platform,
      deviceId,
      exitCode: 1,
      error: error.message,
      completedAt: now(),
    });
    return 1;
  }

  console.log(`Showcase media: ${layout.appRoot}`);
  return 0;
}

if (require.main === module) {
  process.exitCode = run();
}

module.exports = {
  assertExternalOutputRoot,
  buildMaestroArgs,
  createOutputLayout,
  parseArgs,
  promoteSuccessfulRun,
  run,
};
