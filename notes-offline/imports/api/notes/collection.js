import { Mongo } from 'meteor/mongo';
import { Offline } from 'meteor/jam:offline';
import { PubSub } from 'meteor/jam:pub-sub';
import { SoftDelete } from 'meteor/jam:soft-delete';

// Configure jam:offline — must be on both client and server
Offline.configure({
  keepAll: true,
  autoSync: true,
  sort: { updatedAt: -1 },
  limit: 500,
});

// Enable subscription caching globally — data persists in Minimongo between navigations
PubSub.configure({
  cache: true,
});

export const NotesCollection = new Mongo.Collection('notes');

// Enable soft delete — adds `deleted` and `deletedAt` fields,
// auto-filters deleted docs from find/findOne by default
SoftDelete.configure({
  autoFilter: true,
  overrideRemove: true,
});

// Keep active notes offline — trash uses its own subscription
NotesCollection.keep({ deleted: { $ne: true } }, { sort: { updatedAt: -1 }, limit: 500 });
