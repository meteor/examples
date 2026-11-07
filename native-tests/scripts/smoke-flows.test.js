const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FLOW_ROOT = path.join(__dirname, '..', 'flows');

for (const appName of ['stock-scanner', 'city-issue-reporter', 'meteor-drop']) {
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
      /visible: "New app update available"[\s\S]*tapOn: "Not now"/,
      'expected startup to dismiss an HCP prompt without installing it'
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

test('Meteor Drop covers CPU gameplay, records, diagnostics, and a live room', () => {
  const flow = fs.readFileSync(
    path.join(FLOW_ROOT, 'meteor-drop.yaml'),
    'utf8'
  );

  assert.match(flow, /tapOn: "Play vs CPU"/);
  assert.match(flow, /visible: "CPU thinking"/);
  assert.deepStrictEqual(
    [...flow.matchAll(/- tapOn: "Drop meteor in column (\d)"/g)].map(
      (match) => Number(match[1])
    ),
    [4, 2, 3, 1],
    'expected the deterministic four-move CPU win'
  );
  assert.match(flow, /visible: "Four connected!"[\s\S]*assertVisible: "You win"/);
  assert.match(flow, /tapOn: "Home"[\s\S]*tapOn: "Records"/);
  assert.match(flow, /assertVisible: "Solo vs CPU"[\s\S]*assertVisible: "Win"/);
  assert.match(flow, /tapOn: "Live DDP connection"[\s\S]*visible: "DDP paused"/);
  assert.match(flow, /visible: "DDP paused"[\s\S]*visible: "DDP connected"/);
  assert.match(flow, /visible: "New app update available"[\s\S]*assertVisible: "Install update"/);
  assert.match(flow, /tapOn: "Create Live Match"[\s\S]*visible: "Waiting for rival"/);
  assert.match(flow, /assertVisible: "Share Room Code"/);
});
