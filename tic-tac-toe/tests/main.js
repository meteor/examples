import assert from "assert";
import { Meteor } from "meteor/meteor";
import { RoomCollection } from "/imports/api/rooms";

describe("tic-tac-toe", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    assert.strictEqual(name, "tic-tac-toe");
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

    describe("createRoom method", function () {
      it("creates a room with correct defaults", async function () {
        const room = await Meteor.callAsync("createRoom");
        assert.strictEqual(room.capacity, 2);
        assert.strictEqual(room.winner, null);
        assert.strictEqual(room.colorTurn, "cross");
        assert.strictEqual(room.gameState.length, 9);
        assert.ok(room.gameState.every((s) => s === "empty"));
        assert.ok(room.createdAt instanceof Date);

        await RoomCollection.removeAsync(room._id);
      });
    });

    describe("joinRoom method", function () {
      it("first player gets cross, capacity decrements to 1", async function () {
        const room = await Meteor.callAsync("createRoom");
        const result = await Meteor.callAsync("joinRoom", {
          roomId: room._id,
        });
        assert.strictEqual(result.color, "cross");
        assert.strictEqual(result.room.capacity, 1);

        await RoomCollection.removeAsync(room._id);
      });

      it("second player gets circle, capacity decrements to 0", async function () {
        const room = await Meteor.callAsync("createRoom");
        await Meteor.callAsync("joinRoom", { roomId: room._id });
        const result = await Meteor.callAsync("joinRoom", {
          roomId: room._id,
        });
        assert.strictEqual(result.color, "circle");
        assert.strictEqual(result.room.capacity, 0);

        await RoomCollection.removeAsync(room._id);
      });
    });

    describe("makePlay method", function () {
      it("places a cross on the board", async function () {
        const room = await Meteor.callAsync("createRoom");
        await Meteor.callAsync("joinRoom", { roomId: room._id });
        await Meteor.callAsync("joinRoom", { roomId: room._id });

        await Meteor.callAsync("makePlay", {
          roomId: room._id,
          playState: { color: "cross", play: 0 },
        });

        const updated = await RoomCollection.findOneAsync(room._id);
        assert.strictEqual(updated.gameState[0], "cross");
        assert.strictEqual(updated.colorTurn, "circle");

        await RoomCollection.removeAsync(room._id);
      });
    });
  }
});
