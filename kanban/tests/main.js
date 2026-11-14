import assert from 'assert';
import { Meteor } from 'meteor/meteor';

// `meteor test` loads this module instead of the app's entry points.
import '/imports/api/boards/methods';
import '/imports/api/cards/methods';

describe('kanban', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json');
    assert.strictEqual(name, 'kanban');
  });

  require('./titles.tests');
  require('./ranks.tests');
  if (Meteor.isServer) require('./methods.tests');
});
