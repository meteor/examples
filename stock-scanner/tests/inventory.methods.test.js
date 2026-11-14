import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { InventoryItems } from '../imports/api/inventory/collection';
import '../imports/api/inventory/methods';

if (Meteor.isServer) {
  describe('inventory methods', function () {
    beforeEach(async function () {
      await InventoryItems.removeAsync({});
    });

    it('creates an item from a scanned SKU', async function () {
      const ownerId = Random.id();
      const result = await Meteor.callAsync('inventory.scanSku', {
        ownerId,
        sku: '012345678905',
      });

      assert.strictEqual(typeof result.itemId, 'string');
      assert.strictEqual(result.created, true);

      const item = await InventoryItems.findOneAsync(result.itemId);
      assert.strictEqual(item.ownerId, ownerId);
      assert.strictEqual(item.sku, '012345678905');
      assert.strictEqual(item.count, 1);
    });

    it('increments existing item when same SKU is scanned', async function () {
      const ownerId = Random.id();
      await Meteor.callAsync('inventory.scanSku', { ownerId, sku: 'SKU-100' });
      const result = await Meteor.callAsync('inventory.scanSku', {
        ownerId,
        sku: 'SKU-100',
      });

      const item = await InventoryItems.findOneAsync(result.itemId);
      assert.strictEqual(result.created, false);
      assert.strictEqual(item.count, 2);
    });

    it('does not adjust another owner item', async function () {
      const ownerId = Random.id();
      const otherOwnerId = Random.id();
      const { itemId } = await Meteor.callAsync('inventory.scanSku', {
        ownerId,
        sku: 'SKU-LOCKED',
      });

      await assert.rejects(
        () =>
          Meteor.callAsync('inventory.adjustStock', {
            ownerId: otherOwnerId,
            itemId,
            delta: 2,
          }),
        (err) => err.error === 'not-found'
      );
    });
  });
}
