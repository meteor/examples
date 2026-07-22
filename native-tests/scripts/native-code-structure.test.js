const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('Stock Scanner installs one MUI theme at its client boundary', () => {
  const client = read('stock-scanner/client/main.jsx');
  const app = read('stock-scanner/imports/ui/App.jsx');
  const providers = `${client}\n${app}`.match(/<ThemeProvider/g) || [];

  assert.equal(providers.length, 1);
  assert.doesNotMatch(app, /createTheme|<CssBaseline/);
});

test('Civic Snap keeps form state and touch events inside React', () => {
  const app = read('city-issue-reporter/imports/ui/App.jsx');
  const form = read('city-issue-reporter/imports/ui/pages/NewReportPage.jsx');
  const touchButton = read('city-issue-reporter/imports/ui/components/TouchButton.jsx');

  assert.doesNotMatch(app, /document\.getElementById/);
  assert.doesNotMatch(form, /defaultValue|document\.getElementById/);
  assert.doesNotMatch(touchButton, /addEventListener|touchend|preventDefault/);
  assert.match(touchButton, /onClick=\{onPress\}/);
});

test('Meteor Escape delegates native diagnostics and removes stale entry modules', () => {
  const app = read('meteor-escape/imports/ui/App.jsx');

  assert.match(app, /useNativeDiagnostics/);
  assert.doesNotMatch(app, /getApplicationInfo|listenNetworkStatus|listenForHcpUpdates/);
  assert.equal(fs.existsSync(path.join(ROOT, 'meteor-escape/client/main.js')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'city-issue-reporter/imports/ui/routes.js')), false);
});

test('Meteor Escape delegates game access and duplicate-index interpretation', () => {
  const methods = read('meteor-escape/imports/api/games/methods.js');

  assert.match(methods, /from '.\/server\/gameAccess'/);
  assert.doesNotMatch(methods, /function findOwnedGameOrThrow|function isDuplicateKeyError/);
});
