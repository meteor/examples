import assert from 'assert';
import { Meteor } from 'meteor/meteor';
// Import methods to register them with Meteor
import '../imports/api/notes/methods';

describe('notes-offline', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json');
    assert.strictEqual(name, 'notes-offline');
  });

  if (Meteor.isClient) {
    it('client is not server', function () {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it('server is not client', function () {
      assert.strictEqual(Meteor.isClient, false);
    });

    describe('notes.create method', function () {
      it('creates a note with defaults', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          title: 'Integration test note',
          body: 'Test body content',
        });
        assert.ok(noteId);

        const { NotesCollection } = await import('../imports/api/notes/collection');
        const note = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(note.title, 'Integration test note');
        assert.strictEqual(note.body, 'Test body content');
        assert.strictEqual(note.pinned, false);
        assert.deepStrictEqual(note.tags, []);
        assert.ok(note.createdAt instanceof Date);

        await NotesCollection.removeAsync(noteId);
      });
    });

    describe('notes.update method', function () {
      it('updates note title and body', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          title: 'Original',
          body: '',
        });

        await Meteor.callAsync('notes.update', {
          _id: noteId,
          title: 'Updated title',
          body: 'Updated body',
        });

        const { NotesCollection } = await import('../imports/api/notes/collection');
        const note = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(note.title, 'Updated title');
        assert.strictEqual(note.body, 'Updated body');

        await NotesCollection.removeAsync(noteId);
      });
    });

    describe('notes.togglePin method', function () {
      it('toggles pinned state', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          title: 'Pin test',
          body: '',
        });

        await Meteor.callAsync('notes.togglePin', { _id: noteId });

        const { NotesCollection } = await import('../imports/api/notes/collection');
        const pinned = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(pinned.pinned, true);

        await Meteor.callAsync('notes.togglePin', { _id: noteId });

        const unpinned = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(unpinned.pinned, false);

        await NotesCollection.removeAsync(noteId);
      });
    });

    describe('notes.remove method', function () {
      it('marks a note as soft-deleted', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          title: 'Note to delete',
          body: '',
        });

        await Meteor.callAsync('notes.remove', { _id: noteId });

        // Soft-deleted note should have `deleted: true`
        const { NotesCollection } = await import('../imports/api/notes/collection');
        const note = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(note.deleted, true);

        // Clean up permanently
        await NotesCollection.removeAsync(noteId, { forever: true });
      });
    });
  }
});
