import assert from 'assert';
import { Meteor } from 'meteor/meteor';
// Import methods to register them with Meteor
import '../imports/api/notes/methods';

const TEST_OWNER = 'test-owner-1';
const OTHER_OWNER = 'test-owner-2';

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
      it('creates a note with defaults and ownerId', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          ownerId: TEST_OWNER,
          title: 'Integration test note',
          body: 'Test body content',
        });
        assert.ok(noteId);

        const { NotesCollection } = await import('../imports/api/notes/collection');
        const note = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(note.ownerId, TEST_OWNER);
        assert.strictEqual(note.title, 'Integration test note');
        assert.strictEqual(note.body, 'Test body content');
        assert.strictEqual(note.pinned, false);
        assert.deepStrictEqual(note.tags, []);
        assert.ok(note.createdAt instanceof Date);

        await NotesCollection.removeAsync(noteId, { forever: true });
      });
    });

    describe('notes.update method', function () {
      it('updates note title and body', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          ownerId: TEST_OWNER,
          title: 'Original',
          body: '',
        });

        await Meteor.callAsync('notes.update', {
          _id: noteId,
          ownerId: TEST_OWNER,
          title: 'Updated title',
          body: 'Updated body',
        });

        const { NotesCollection } = await import('../imports/api/notes/collection');
        const note = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(note.title, 'Updated title');
        assert.strictEqual(note.body, 'Updated body');

        await NotesCollection.removeAsync(noteId, { forever: true });
      });
    });

    describe('notes.togglePin method', function () {
      it('toggles pinned state', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          ownerId: TEST_OWNER,
          title: 'Pin test',
          body: '',
        });

        await Meteor.callAsync('notes.togglePin', { _id: noteId, ownerId: TEST_OWNER });

        const { NotesCollection } = await import('../imports/api/notes/collection');
        const pinned = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(pinned.pinned, true);

        await Meteor.callAsync('notes.togglePin', { _id: noteId, ownerId: TEST_OWNER });

        const unpinned = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(unpinned.pinned, false);

        await NotesCollection.removeAsync(noteId, { forever: true });
      });
    });

    describe('notes.remove method', function () {
      it('marks a note as soft-deleted', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          ownerId: TEST_OWNER,
          title: 'Note to delete',
          body: '',
        });

        await Meteor.callAsync('notes.remove', { _id: noteId, ownerId: TEST_OWNER });

        const { NotesCollection } = await import('../imports/api/notes/collection');
        const note = await NotesCollection.findOneAsync(noteId, { softDelete: false });
        assert.strictEqual(note.deleted, true);

        await NotesCollection.removeAsync(noteId, { forever: true });
      });
    });

    describe('ownership enforcement', function () {
      it('rejects update from a different ownerId', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          ownerId: TEST_OWNER,
          title: 'Mine',
          body: '',
        });

        await assert.rejects(
          Meteor.callAsync('notes.update', {
            _id: noteId,
            ownerId: OTHER_OWNER,
            title: 'Hacked',
          }),
          (err) => err.error === 'not-found'
        );

        const { NotesCollection } = await import('../imports/api/notes/collection');
        const note = await NotesCollection.findOneAsync(noteId);
        assert.strictEqual(note.title, 'Mine');

        await NotesCollection.removeAsync(noteId, { forever: true });
      });

      it('rejects remove from a different ownerId', async function () {
        const noteId = await Meteor.callAsync('notes.create', {
          ownerId: TEST_OWNER,
          title: 'Mine',
          body: '',
        });

        await assert.rejects(
          Meteor.callAsync('notes.remove', { _id: noteId, ownerId: OTHER_OWNER }),
          (err) => err.error === 'not-found'
        );

        // findOneAsync auto-filters soft-deleted docs; getting a doc back proves
        // the note was not soft-deleted by the unauthorized call.
        const { NotesCollection } = await import('../imports/api/notes/collection');
        const note = await NotesCollection.findOneAsync(noteId);
        assert.ok(note, 'note should still exist and not be soft-deleted');
        assert.notStrictEqual(note.deleted, true);

        await NotesCollection.removeAsync(noteId, { forever: true });
      });

      it('emptyTrash only affects the caller ownerId', async function () {
        const { NotesCollection } = await import('../imports/api/notes/collection');

        const mineId = await Meteor.callAsync('notes.create', {
          ownerId: TEST_OWNER,
          title: 'Mine trashed',
          body: '',
        });
        const theirsId = await Meteor.callAsync('notes.create', {
          ownerId: OTHER_OWNER,
          title: 'Theirs trashed',
          body: '',
        });

        await Meteor.callAsync('notes.remove', { _id: mineId, ownerId: TEST_OWNER });
        await Meteor.callAsync('notes.remove', { _id: theirsId, ownerId: OTHER_OWNER });

        await Meteor.callAsync('notes.emptyTrash', { ownerId: TEST_OWNER });

        const mine = await NotesCollection.findOneAsync(mineId, { softDelete: false });
        const theirs = await NotesCollection.findOneAsync(theirsId, { softDelete: false });
        assert.strictEqual(mine, undefined);
        assert.ok(theirs);
        assert.strictEqual(theirs.deleted, true);

        await NotesCollection.removeAsync(theirsId, { forever: true });
      });
    });
  }
});
