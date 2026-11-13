import assert from 'assert';
import { splitTitles, cleanTitle } from '/imports/api/cards/titles';

describe('splitTitles', function () {
  it('makes one title per non-empty line', function () {
    assert.deepStrictEqual(splitTitles('Buy milk\n\n  Call Sam  \r\nShip it'), ['Buy milk', 'Call Sam', 'Ship it']);
  });

  it('strips list markers', function () {
    assert.deepStrictEqual(
      splitTitles('- one\n* two\n• three\n1. four\n2) five\n[ ] six\n[x] seven'),
      ['one', 'two', 'three', 'four', 'five', 'six', 'seven'],
    );
  });

  it('keeps a dash that is part of the title', function () {
    assert.deepStrictEqual(splitTitles('-5 degrees\nfoo-bar'), ['-5 degrees', 'foo-bar']);
  });
});

describe('cleanTitle', function () {
  it('trims and caps the length', function () {
    assert.strictEqual(cleanTitle('  hello '), 'hello');
    assert.strictEqual(cleanTitle('x'.repeat(300)).length, 200);
  });
});
