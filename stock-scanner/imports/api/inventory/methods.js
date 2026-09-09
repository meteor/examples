import { Meteor } from 'meteor/meteor';
import { InventoryItems } from './collection';
import {
  AdjustStockSchema,
  ScanSkuSchema,
  UpdateItemSchema,
  parseOrThrow,
} from './schema';

async function findOwnItemOrThrow({ ownerId, itemId }) {
  const item = await InventoryItems.findOneAsync({ _id: itemId, ownerId });
  if (!item) {
    throw new Meteor.Error('not-found', 'Inventory item not found');
  }
  return item;
}

Meteor.methods({
  async 'inventory.scanSku'(payload) {
    const { ownerId, sku } = parseOrThrow(ScanSkuSchema, payload);
    const now = new Date();
    const existing = await InventoryItems.findOneAsync({ ownerId, sku });

    if (existing) {
      const count = existing.count + 1;
      await InventoryItems.updateAsync(existing._id, {
        $set: { count, updatedAt: now, lastScannedAt: now },
      });
      return { itemId: existing._id, created: false };
    }

    const itemId = await InventoryItems.insertAsync({
      ownerId,
      sku,
      name: `SKU ${sku}`,
      category: 'Other',
      count: 1,
      minStock: 3,
      createdAt: now,
      updatedAt: now,
      lastScannedAt: now,
    });

    return { itemId, created: true };
  },

  async 'inventory.adjustStock'(payload) {
    const { ownerId, itemId, delta } = parseOrThrow(AdjustStockSchema, payload);
    const item = await findOwnItemOrThrow({ ownerId, itemId });
    const count = Math.max(0, item.count + delta);

    await InventoryItems.updateAsync(itemId, {
      $set: { count, updatedAt: new Date() },
    });

    return { itemId, count };
  },

  async 'inventory.updateItem'(payload) {
    const { ownerId, itemId, name, category, minStock } = parseOrThrow(
      UpdateItemSchema,
      payload
    );
    await findOwnItemOrThrow({ ownerId, itemId });

    await InventoryItems.updateAsync(itemId, {
      $set: { name, category, minStock, updatedAt: new Date() },
    });

    return { itemId };
  },
});
