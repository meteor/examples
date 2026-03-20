import { Meteor } from 'meteor/meteor';
import { NotesCollection } from './collection';

// Active notes
Meteor.publish('notes', function () {
  return NotesCollection.find(
    {},
    {
      sort: { pinned: -1, updatedAt: -1 },
    }
  );
});

// Deleted notes for trash view — bypasses soft-delete auto-filter
Meteor.publish('notes.trash', function () {
  return NotesCollection.find(
    { deleted: true },
    {
      sort: { deletedAt: -1 },
      softDelete: false,
    }
  );
});
