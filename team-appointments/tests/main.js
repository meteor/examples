import assert from 'assert';
import { Meteor } from 'meteor/meteor';

// `meteor test` loads this module instead of the app's entry points.
import '/imports/api/appointments';

describe('team-appointments', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json');
    assert.strictEqual(name, 'team-appointments');
  });

  require('./when.tests');
  if (Meteor.isServer) require('./methods.tests');
});
