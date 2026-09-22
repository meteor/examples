import path from 'node:path';
import { expect, test } from '@rstest/core';

// Intentionally kept under tests/rstest to prove compatibility-root routing.
test('compatibility root receives Meteor native config context', () => {
  expect(process.env.SHOWCASE_CONFIG_PHASE).toBe('native');
  expect(process.env.SHOWCASE_CONFIG_APP_ROOT).toBe(
    path.resolve(import.meta.dirname, '../../../..'),
  );
});
