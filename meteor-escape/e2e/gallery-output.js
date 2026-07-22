const path = require('node:path');

function resolveScreenshotDir(env = process.env) {
  if (!env.NATIVE_SHOWCASE_OUTPUT_DIR) {
    throw new Error('NATIVE_SHOWCASE_OUTPUT_DIR is required for gallery capture');
  }

  return path.join(
    path.resolve(env.NATIVE_SHOWCASE_OUTPUT_DIR),
    'meteor-escape',
    'screenshots',
    'gallery'
  );
}

module.exports = { resolveScreenshotDir };
