const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const css = readFileSync(
  path.join(__dirname, '..', '..', 'meteor-escape', 'client', 'main.css'),
  'utf8'
);
const missionStage = readFileSync(
  path.join(
    __dirname,
    '..',
    '..',
    'meteor-escape',
    'imports',
    'ui',
    'components',
    'MissionStage.jsx'
  ),
  'utf8'
);

test('Meteor Escape keeps iOS text sizing aligned with the designed viewport', () => {
  assert.match(css, /-webkit-text-size-adjust:\s*100%/);
  assert.match(css, /text-size-adjust:\s*100%/);
});

test('Meteor Escape presents the active emergency before decorative mission artwork', () => {
  const promptPosition = missionStage.indexOf('<EmergencyPrompt');
  const artworkPosition = missionStage.indexOf('<ShipArt');

  assert.notEqual(promptPosition, -1);
  assert.notEqual(artworkPosition, -1);
  assert.ok(promptPosition < artworkPosition);
});
