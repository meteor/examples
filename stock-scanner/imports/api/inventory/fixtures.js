import { Meteor } from 'meteor/meteor';
import { InventoryItems } from './collection';

const DEMO_OWNER_ID = 'demo-stock-owner';

const FIXTURES = [
  ['011122233344', 'USB-C charging cable', 'Electronics', 8, 5],
  ['500011263476', 'First aid refill kit', 'Pharmacy', 2, 4],
  ['700451000128', 'Shelf label clips', 'Hardware', 14, 8],
  ['843701100215', 'Organic oat cartons', 'Grocery', 5, 10],
  ['220090170042', 'Packable rain shell', 'Apparel', 11, 6],
];

Meteor.startup(async () => {
  const now = new Date();
  for (const [sku, name, category, count, minStock] of FIXTURES) {
    if (await InventoryItems.findOneAsync({ ownerId: DEMO_OWNER_ID, sku })) continue;
    await InventoryItems.insertAsync({
      ownerId: DEMO_OWNER_ID,
      sku,
      name,
      category,
      count,
      minStock,
      createdAt: now,
      updatedAt: now,
    });
  }
});
