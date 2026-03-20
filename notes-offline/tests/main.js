import assert from "assert";

describe("notes-offline", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    assert.strictEqual(name, "notes-offline");
  });

  if (Meteor.isClient) {
    it("client is not server", function () {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it("server is not client", function () {
      assert.strictEqual(Meteor.isClient, false);
    });

    it("inserts and finds a note", async function () {
      const { NotesCollection } = await import(
        "../imports/api/notes/collection"
      );
      const noteId = await NotesCollection.insertAsync({
        title: "Test note",
        body: "Test body",
        tags: [],
        pinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const note = await NotesCollection.findOneAsync(noteId);
      assert.strictEqual(note.title, "Test note");
      assert.strictEqual(note.body, "Test body");
      assert.strictEqual(note.pinned, false);

      await NotesCollection.removeAsync(noteId);
    });

    it("updates note fields", async function () {
      const { NotesCollection } = await import(
        "../imports/api/notes/collection"
      );
      const noteId = await NotesCollection.insertAsync({
        title: "Original",
        body: "",
        tags: [],
        pinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await NotesCollection.updateAsync(noteId, {
        $set: { title: "Updated", pinned: true },
      });

      const note = await NotesCollection.findOneAsync(noteId);
      assert.strictEqual(note.title, "Updated");
      assert.strictEqual(note.pinned, true);

      await NotesCollection.removeAsync(noteId);
    });
  }
});
