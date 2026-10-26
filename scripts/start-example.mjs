import { spawn } from 'node:child_process';

// METEOR_BIN selects a source checkout; METEOR_RELEASE selects an installed release.
const args = [];
if (process.env.METEOR_RELEASE) {
  args.push('--release', process.env.METEOR_RELEASE);
}
args.push('run', '--settings', 'settings.json', '--port', process.env.PORT || '3000');
if (process.env.METEOR_APP_PORT) {
  args.push('--app-port', process.env.METEOR_APP_PORT);
}

const meteor = spawn(process.env.METEOR_BIN || 'meteor', args, {
  stdio: 'inherit',
  env: process.env,
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => meteor.kill(signal));
}
meteor.once('error', error => {
  console.error(error.message);
  process.exitCode = 1;
});
meteor.once('exit', code => {
  process.exitCode = code ?? 1;
});
