import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(import.meta.dirname, '../..');

const primaryExamples = {
  native: 'imports/game/rules.test.ts',
  browser: 'imports/ui/MemoryGame.interactions.test.tsx',
  meteorShared: 'imports/api/runtime-context.test.ts',
  e2e: 'tests/e2e/memory-game.test.ts',
};

const fallbackExamples = {
  globals: 'imports/game/globals.rstest.test.ts',
  dom: 'imports/ui/MemoryGame.dom.rstest.test.tsx',
  meteorServer: 'imports/api/methods.server.meteor.rstest.test.ts',
  meteorClient: 'imports/ui/App.client.meteor.rstest.test.tsx',
  compatibility: 'tests/rstest/pure/server/compatibility.test.ts',
};

function source(relativePath) {
  return readFileSync(path.join(appRoot, relativePath), 'utf8');
}

function collectTests(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectTests(target)
      : /\.(?:test|spec)s?\.[cm]?[jt]sx?$/.test(entry.name) ? [target] : [];
  });
}

test('dependency imports are primary showcase routing path', () => {
  for (const relativePath of Object.values(primaryExamples)) {
    assert.equal(existsSync(path.join(appRoot, relativePath)), true, relativePath);
    assert.doesNotMatch(relativePath, /\.rstest\.(?:test|spec)/);
  }

  assert.match(source(primaryExamples.native), /from ['"]@rstest\/core['"]/);
  assert.match(source(primaryExamples.browser), /from ['"]@rstest\/browser['"]/);
  assert.match(source(primaryExamples.meteorShared), /from ['"]@rstest\/core['"]/);
  assert.match(source(primaryExamples.meteorShared), /from ['"]meteor\/meteor['"]/);
  assert.match(source(primaryExamples.e2e), /from ['"]@rstest\/playwright['"]/);
});

test('filename and compatibility hints remain secondary fallback examples', () => {
  for (const relativePath of Object.values(fallbackExamples)) {
    assert.equal(existsSync(path.join(appRoot, relativePath)), true, relativePath);
  }

  assert.doesNotMatch(source(fallbackExamples.globals), /from ['"]@rstest\/core['"]/);
  assert.match(source(fallbackExamples.globals), /@rstest\/core\/globals/);
  assert.match(source(fallbackExamples.dom), /from ['"]@rstest\/core['"]/);
  assert.match(source(fallbackExamples.meteorServer), /from ['"]@rstest\/core['"]/);
  assert.match(source(fallbackExamples.meteorClient), /from ['"]@rstest\/core['"]/);
});

test('all showcase tests use upstream Rstest declarations', () => {
  const testFiles = [
    ...collectTests(path.join(appRoot, 'imports')),
    ...collectTests(path.join(appRoot, 'packages')),
    ...collectTests(path.join(appRoot, 'tests')),
  ];

  for (const file of testFiles) {
    assert.doesNotMatch(source(path.relative(appRoot, file)), /from ['"]meteor\/rstest['"]/);
  }
});

test('only one test remains under compatibility routing roots', () => {
  const compatibilityTests = collectTests(path.join(appRoot, 'tests', 'rstest'));
  assert.deepEqual(
    compatibilityTests.map((file) => path.relative(appRoot, file)),
    [fallbackExamples.compatibility],
  );
});
