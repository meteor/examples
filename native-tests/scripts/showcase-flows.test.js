const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const FLOW_ROOT = path.join(__dirname, '..', 'flows', 'showcase');

function readFlow(name) {
  return fs.readFileSync(path.join(FLOW_ROOT, `${name}.yaml`), 'utf8');
}

for (const appName of ['stock-scanner', 'city-issue-reporter', 'meteor-drop']) {
  test(`${appName} records a user-facing showcase journey`, () => {
    const flow = readFlow(appName);
    assert.match(flow, /startRecording:/);
    assert.match(flow, /\$\{SHOWCASE_VIDEO_PATH\}/);
    assert.match(flow, /takeScreenshot:/);
    assert.match(flow, /\$\{SHOWCASE_POSTER_PATH\}/);
    assert.match(flow, /- stopRecording/);
    assert.doesNotMatch(flow, /Meteor\.isCapacitor|DDP/);
    if (appName === 'city-issue-reporter') {
      assert.doesNotMatch(flow, /System information|Preview HCP update/);
      assert.match(
        flow,
        /visible: "New app update available"[\s\S]*tapOn: "Not now"/,
        'expected an automatic HCP prompt to be dismissed during recording'
      );
    }
  });

  test(`${appName} includes deliberate presentation holds`, () => {
    const flow = readFlow(appName);
    const pauses = [...flow.matchAll(/file: presentation-pause\.js\n\s+env:\n\s+PAUSE_MS: (\d+)/g)];
    const totalPauseMs = pauses.reduce((total, match) => total + Number(match[1]), 0);

    assert.ok(pauses.length >= 5, 'expected holds across major screens');
    assert.ok(totalPauseMs >= 12000, 'expected at least 12 seconds of reading time');
    const maxPauseMs = appName === 'meteor-drop' ? 45000 : 25000;
    assert.ok(totalPauseMs <= maxPauseMs, 'expected showcase to remain concise');
  });
}

test('stock scanner showcases counting, product detail, and low-stock review', () => {
  const flow = readFlow('stock-scanner');
  assert.match(flow, /Manual SKU/);
  assert.match(flow, /SKU-SHOWCASE-\$\{SHOWCASE_RUN_ID\}/);
  assert.match(flow, /Count adjustment/);
  assert.match(flow, /\.\*Count up/);
  assert.match(flow, /Show low stock/);
});

test('civic snap showcases report intake and submitted detail', () => {
  const flow = readFlow('city-issue-reporter');
  assert.match(flow, /New report/);
  assert.match(flow, /Open report: Pothole report/);
  assert.match(flow, /Issue title/);
  assert.match(flow, /Submit current report/);
  assert.match(flow, /Report detail/);
  assert.match(flow, /Pothole report/);
  assert.match(flow, /Submitted/);
});

test('civic snap shows native sharing after a submitted report', () => {
  const flow = readFlow('city-issue-reporter');
  const sharePosition = flow.indexOf('tapOn: "Share report"');
  const detailPosition = flow.indexOf('visible: "Report detail"');
  const backPosition = flow.indexOf('tapOn: "Back to reports"');

  assert.ok(sharePosition > detailPosition, 'expected sharing after report detail');
  assert.match(flow, /visible: "Copy"/);
  assert.match(flow, /point: "50%,20%"/);
  assert.match(flow, /assertNotVisible: "Copy"/);
  assert.ok(backPosition > sharePosition, 'expected reports list after sharing');
});

test('stock scanner closes with an HCP update dialog after inventory review', () => {
  const flow = readFlow('stock-scanner');
  const lowStockPosition = flow.indexOf('Show low stock');
  const updatePosition = flow.indexOf('Preview HCP update');

  assert.ok(lowStockPosition !== -1);
  assert.ok(updatePosition > lowStockPosition);
  assert.match(flow, /tapOn: "System information"/);
  assert.match(flow, /visible: "New app update available"/);
  assert.match(flow, /assertVisible: "Install update"/);
});

test('Meteor Drop showcases CPU play, sharing, records, HCP, and a live room', () => {
  const flow = readFlow('meteor-drop');
  assert.match(
    flow,
    /visible: "New app update available"[\s\S]*tapOn: "Not now"[\s\S]*startRecording:/,
    'expected a pending HCP prompt to be dismissed before recording begins'
  );
  assert.match(flow, /tapOn: "Play vs CPU"/);
  assert.match(flow, /visible: "CPU thinking"/);
  assert.deepStrictEqual(
    [...flow.matchAll(/- tapOn: "Drop meteor in column (\d)"/g)].map(
      (match) => Number(match[1])
    ),
    [4, 2, 3, 1],
    'expected the showcase to demonstrate a short winning line'
  );
  assert.match(
    flow,
    /visible: "Four connected!"[\s\S]*assertVisible: "You win"[\s\S]*takeScreenshot: \$\{SHOWCASE_POSTER_PATH\}/
  );
  assert.match(flow, /tapOn: "Share Result"[\s\S]*visible: "Copy"/);
  assert.match(flow, /assertNotVisible: "Copy"[\s\S]*tapOn: "Home"/);
  assert.match(flow, /tapOn: "Records"[\s\S]*visible: "Solo vs CPU"/);
  assert.match(flow, /tapOn: "System"[\s\S]*tapOn: "Preview HCP update"/);
  assert.match(flow, /visible: "New app update available"/);
  assert.match(flow, /tapOn: "Create Live Match"/);
  assert.match(flow, /visible: "Waiting for rival"/);
  assert.match(flow, /assertVisible: "Share Room Code"/);
});
