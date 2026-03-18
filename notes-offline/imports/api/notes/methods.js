import { Meteor } from 'meteor/meteor';
import { z } from 'zod';
import { createMethod } from 'meteor/jam:method';
import { NotesCollection } from './collection';
import { CreateNoteSchema, UpdateNoteSchema, NoteIdSchema } from './schema';

export const createNote = createMethod({
  name: 'notes.create',
  schema: CreateNoteSchema,
  open: true,
  async run({ title, body }) {
    const now = new Date();
    return NotesCollection.insertAsync({
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
  async run({ _id, ...fields }) {
    return NotesCollection.updateAsync(_id, {
      $set: { ...fields, updatedAt: new Date() },
    });
  },
});

// Soft delete — marks as deleted, recoverable from trash
export const removeNote = createMethod({
  name: 'notes.remove',
  schema: NoteIdSchema,
  open: true,
  async run({ _id }) {
    return NotesCollection.removeAsync(_id);
  },
});

// Recover from trash
export const recoverNote = createMethod({
  name: 'notes.recover',
  schema: NoteIdSchema,
  open: true,
  async run({ _id }) {
    return NotesCollection.recoverAsync(_id);
  },
});

// Permanent delete — bypasses soft delete with { forever: true }
export const permanentDeleteNote = createMethod({
  name: 'notes.permanentDelete',
  schema: NoteIdSchema,
  open: true,
  async run({ _id }) {
    return NotesCollection.removeAsync(_id, { forever: true });
  },
});

export const togglePin = createMethod({
  name: 'notes.togglePin',
  schema: NoteIdSchema,
  open: true,
  async run({ _id }) {
    const note = await NotesCollection.findOneAsync(_id);
    if (!note) throw new Meteor.Error('not-found', 'Note not found');
    return NotesCollection.updateAsync(_id, {
      $set: { pinned: !note.pinned, updatedAt: new Date() },
    });
  },
});

// Empty entire trash
export const emptyTrash = createMethod({
  name: 'notes.emptyTrash',
  schema: z.object({}),
  open: true,
  async run() {
    const deleted = await NotesCollection.find({ deleted: true }).fetchAsync();
    for (const note of deleted) {
      await NotesCollection.removeAsync(note._id, { forever: true });
    }
  },
});
