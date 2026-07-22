const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FLOW_ROOT = path.join(__dirname, '..', 'flows');

for (const appName of ['stock-scanner', 'city-issue-reporter', 'meteor-escape']) {
  test(`${appName} scrolls technical controls into reach on phones`, () => {
    const flow = fs.readFileSync(path.join(FLOW_ROOT, `${appName}.yaml`), 'utf8');
    assert.match(
      flow,
      /scrollUntilVisible:\n\s+element:\n\s+text: "Preview HCP update"/,
      'expected phone-safe scroll before HCP preview'
    );
  });
}

test('civic snap restores its app bar after diagnostics on phones', () => {
  const flow = fs.readFileSync(
    path.join(FLOW_ROOT, 'city-issue-reporter.yaml'),
    'utf8'
  );
  assert.match(
    flow,
    /scrollUntilVisible:\n\s+element:\n\s+text: "Open navigation"\n\s+direction: UP/,
    'expected the drawer action to be restored after the diagnostics scroll'
  );
  assert.match(flow, /tapOn: "Submit current report"/);
  assert.match(flow, /assertVisible: "Pothole report"/);
  assert.match(flow, /visible: "Report detail"/, 'expected a completed submission');
});

test('meteor escape returns from diagnostics through its visible tab navigation', () => {
  const flow = fs.readFileSync(
    path.join(FLOW_ROOT, 'meteor-escape.yaml'),
    'utf8'
  );
  assert.match(flow, /tapOn: "Not now"\n- tapOn: "Play"/);
  assert.doesNotMatch(flow, /tapOn: "Not now"\n- back/);
});
