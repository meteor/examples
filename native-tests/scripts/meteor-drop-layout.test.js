const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const appRoot = path.join(__dirname, '..', '..', 'meteor-drop');
const css = readFileSync(path.join(appRoot, 'client', 'main.css'), 'utf8');
const board = readFileSync(
  path.join(appRoot, 'imports', 'ui', 'components', 'MeteorBoard.jsx'),
  'utf8'
);
const systemInfo = readFileSync(
  path.join(appRoot, 'imports', 'ui', 'pages', 'SystemInfoPage.jsx'),
  'utf8'
);

test('Meteor Drop keeps iOS text sizing aligned with the designed viewport', () => {
  assert.match(css, /-webkit-text-size-adjust:\s*100%/);
  assert.match(css, /text-size-adjust:\s*100%/);
});

test('Meteor Drop preserves a stable 6-by-7 board with mobile touch targets', () => {
  assert.match(css, /\.meteor-board\s*\{[\s\S]*aspect-ratio:\s*7\s*\/\s*6/);
  assert.match(css, /\.meteor-board__column-target\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(board, /aria-rowcount="6"/);
  assert.match(board, /aria-colcount="7"/);
  assert.match(board, /Drop meteor in column/);
});

test('Meteor Drop makes the full DDP setting row a native-sized switch target', () => {
  assert.match(
    systemInfo,
    /<button[\s\S]*className="system-toggle-row"[\s\S]*role="switch"[\s\S]*aria-label="Live DDP connection"/
  );
});
