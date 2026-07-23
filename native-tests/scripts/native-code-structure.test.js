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

test('Meteor Drop delegates native diagnostics and removes stale entry modules', () => {
  const app = read('meteor-drop/imports/ui/App.jsx');

  assert.match(app, /useNativeDiagnostics/);
  assert.doesNotMatch(app, /getApplicationInfo|listenNetworkStatus|listenForHcpUpdates/);
  assert.equal(fs.existsSync(path.join(ROOT, 'meteor-drop/client/main.js')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'city-issue-reporter/imports/ui/routes.js')), false);
});

test('Meteor Drop delegates game access and duplicate-index interpretation', () => {
  const methods = read('meteor-drop/imports/api/games/methods.js');

  assert.match(methods, /from '.\/server\/gameAccess'/);
  assert.doesNotMatch(methods, /function findOwnedGameOrThrow|function isDuplicateKeyError/);
});

test('native examples install HCP consent gates before mounting React', () => {
  for (const app of ['stock-scanner', 'city-issue-reporter', 'meteor-drop']) {
    const client = read(`${app}/client/main.jsx`);
    const gate = read(`${app}/imports/ui/native/hcpReloadGate.client.js`);

    assert.match(client, /import '\.\.\/imports\/ui\/native\/hcpReloadGate\.client'/);
    assert.match(gate, /import \{ Reload \} from 'meteor\/reload'/);
    assert.match(gate, /if \(Meteor\.isCapacitor\)/);
    assert.match(gate, /hcpReloadConsent\.install\(Reload\)/);
    assert.match(gate, /listenForHcpUpdates\(\(\) => \{\}\)/);
  }
});
