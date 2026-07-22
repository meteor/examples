const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveScreenshotDir } = require('./gallery-output');

test('resolves gallery screenshots inside the external showcase library', () => {
  assert.equal(
    resolveScreenshotDir({ NATIVE_SHOWCASE_OUTPUT_DIR: '/media/native-app-showcase' }),
    '/media/native-app-showcase/meteor-escape/screenshots/gallery'
  );
});

test('requires an external showcase library', () => {
  assert.throws(
    () => resolveScreenshotDir({}),
    /NATIVE_SHOWCASE_OUTPUT_DIR is required for gallery capture/
  );
});
