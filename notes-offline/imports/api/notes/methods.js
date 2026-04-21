import { Meteor } from 'meteor/meteor';
import { createMethod } from 'meteor/jam:method';
import { NotesCollection } from './collection';
import { CreateNoteSchema, UpdateNoteSchema, NoteIdSchema, OwnerScopedSchema } from './schema';

// ownerId is client-supplied since there are no accounts. This gives
// per-device scoping for anonymous demo use, not cryptographic isolation.
// deleted: { $in: [true, false] } opts out of jam:soft-delete auto-filter so
// recover/permanentDelete can look up trashed notes.
async function assertOwns(_id, ownerId) {
  const note = await NotesCollection.findOneAsync({
    _id,
    ownerId,
    deleted: { $in: [true, false] },
  });
  if (!note) throw new Meteor.Error('not-found', 'Note not found');
  return note;
}

export const createNote = createMethod({
  name: 'notes.create',
  schema: CreateNoteSchema,
  open: true,
  async run({ ownerId, title, body }) {
    const now = new Date();
    return NotesCollection.insertAsync({
      ownerId,
      title,
      body,
      pinned: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateNote = createMethod({
  name: 'notes.update',
  schema: UpdateNoteSchema,
  open: true,
  async run({ _id, ownerId, ...fields }) {
    await assertOwns(_id, ownerId);
    return NotesCollection.updateAsync(_id, {
      $set: { ...fields, updatedAt: new Date() },
    });
  },
});

export const removeNote = createMethod({
  name: 'notes.remove',
  schema: NoteIdSchema,
  open: true,
  async run({ _id, ownerId }) {
    await assertOwns(_id, ownerId);
    return NotesCollection.removeAsync(_id);
  },
});

export const recoverNote = createMethod({
  name: 'notes.recover',
  schema: NoteIdSchema,
  open: true,
  async run({ _id, ownerId }) {
    await assertOwns(_id, ownerId);
    return NotesCollection.recoverAsync(_id);
  },
});

export const permanentDeleteNote = createMethod({
  name: 'notes.permanentDelete',
  schema: NoteIdSchema,
  open: true,
  async run({ _id, ownerId }) {
    await assertOwns(_id, ownerId);
    return NotesCollection.removeAsync(_id, { forever: true });
  },
});

export const togglePin = createMethod({
  name: 'notes.togglePin',
  schema: NoteIdSchema,
  open: true,
  async run({ _id, ownerId }) {
    const note = await assertOwns(_id, ownerId);
    return NotesCollection.updateAsync(_id, {
      $set: { pinned: !note.pinned, updatedAt: new Date() },
    });
  },
});

export const emptyTrash = createMethod({
  name: 'notes.emptyTrash',
  schema: OwnerScopedSchema,
  open: true,
  async run({ ownerId }) {
    const deleted = await NotesCollection.find(
      { ownerId, deleted: true },
      { softDelete: false }
    ).fetchAsync();
    for (const note of deleted) {
      await NotesCollection.removeAsync(note._id, { forever: true });
    }
  },
});
