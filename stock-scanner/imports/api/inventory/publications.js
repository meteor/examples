import { Meteor } from 'meteor/meteor';
import { InventoryItems } from './collection';

Meteor.publish('inventory.byOwner', function (ownerId) {
  if (typeof ownerId !== 'string' || ownerId.length === 0) {
    return this.ready();
  }

  return InventoryItems.find(
    { ownerId },
    {
      sort: { updatedAt: -1 },
    }
  );
});
