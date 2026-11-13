import assert from 'assert';
import { rankBetween, needsRenumbering } from '/imports/api/cards/ranks';

describe('rankBetween', function () {
  it('starts at 0 in an empty column', function () {
    assert.strictEqual(rankBetween(undefined, undefined), 0);
  });

  it('goes before the first and after the last card', function () {
    assert.strictEqual(rankBetween(undefined, 0), -1);
    assert.strictEqual(rankBetween(3, undefined), 4);
  });

  it('takes the midpoint between two cards', function () {
    assert.strictEqual(rankBetween(1, 2), 1.5);
  });
});

describe('needsRenumbering', function () {
  it('only when two neighbours are too close', function () {
    assert.strictEqual(needsRenumbering(1, 2), false);
    assert.strictEqual(needsRenumbering(undefined, 1e-9), false);
    assert.strictEqual(needsRenumbering(1, 1 + 1e-9), true);
  });
});
