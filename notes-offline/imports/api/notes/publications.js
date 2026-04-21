import { Meteor } from 'meteor/meteor';
import { NotesCollection } from './collection';

// ownerId is client-supplied (anonymous per-device scoping, not auth).
Meteor.publish('notes', function (ownerId) {
  if (typeof ownerId !== 'string' || !ownerId) return this.ready();
  return NotesCollection.find(
    { ownerId },
    {
      sort: { pinned: -1, updatedAt: -1 },
    }
  );
});

Meteor.publish('notes.trash', function (ownerId) {
  if (typeof ownerId !== 'string' || !ownerId) return this.ready();
  return NotesCollection.find(
    { ownerId, deleted: true },
    {
      sort: { deletedAt: -1 },
      softDelete: false,
    }
  );
});
