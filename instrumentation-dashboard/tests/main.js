import assert from 'assert';
import { Meteor } from 'meteor/meteor';

describe('instrumentation-dashboard', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json');
    assert.strictEqual(name, 'instrumentation-dashboard');
  });

  if (Meteor.isServer) {
    require('./collector-core.tests');
    require('./snapshot-core.tests');
    require('./integration.tests');
  }
});
