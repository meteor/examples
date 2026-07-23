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

  test(`${appName} tolerates a real HCP prompt during startup`, () => {
    const flow = fs.readFileSync(path.join(FLOW_ROOT, `${appName}.yaml`), 'utf8');
    assert.match(
      flow,
      /retry:\n\s+maxRetries: 3\n\s+commands:\n\s+- runFlow:\n\s+when:\n\s+visible: "New app update available"\n\s+commands:\n\s+- tapOn: "Not now"\n\s+- waitForAnimationToEnd:\n\s+timeout: 5000/,
      'expected startup navigation to dismiss an HCP prompt without installing it'
    );
  });

  test(`${appName} reviews a pending native update before using the preview`, () => {
    const flow = fs.readFileSync(path.join(FLOW_ROOT, `${appName}.yaml`), 'utf8');
    assert.match(
      flow,
      /runFlow:\n\s+when:\n\s+visible: "Update ready"\n\s+commands:\n\s+- tapOn: "Review update"[\s\S]*runFlow:\n\s+when:\n\s+notVisible: "New app update available"[\s\S]*text: "Preview HCP update"/,
      'expected the pending-update reminder to avoid covering the preview control'
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
    /tapOn: "Not now"\n- repeat:\n\s+times: 5[\s\S]*start: "50%,30%"[\s\S]*tapOn: "Open navigation"/,
    'expected diagnostics to return to its app bar before opening the drawer'
  );
  assert.doesNotMatch(
    flow,
    /scrollUntilVisible:\n\s+element:\n\s+text: "Open navigation"/
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
  assert.match(
    flow,
    /visible: "Mission control"[\s\S]*assertVisible: "Meteor"\n- tapOn: "Shield"\n- extendedWaitUntil:\n\s+visible: "Warp charged"/,
    'expected the timed test mission to act before checking transient turn states'
  );
  assert.match(flow, /tapOn: "Not now"\n- tapOn: "Play"/);
  assert.doesNotMatch(flow, /tapOn: "Not now"\n- back/);
});
