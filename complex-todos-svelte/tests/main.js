import assert from 'assert';
import './package.json.test.js';
import '../imports/modules/tasks/tasks.methods.test.js';

describe('Meteor tests', function()
{
  if(Meteor.isClient)
  {
    it('client is not server', function()
    {
      assert.strictEqual(Meteor.isServer, false);
    });
  }
  
  if(Meteor.isServer)
  {
    it('server is not client', function()
    {
      assert.strictEqual(Meteor.isClient, false);
    });
  }
});
