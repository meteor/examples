import assert from "assert";
import { Meteor } from "meteor/meteor";
import { RoomCollection } from "../imports/api/rooms";

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

    describe("createRoom", function () {
      it("creates a room with correct defaults", async function () {
        const room = await Meteor.callAsync("createRoom");
        assert.strictEqual(room.capacity, 2);
        assert.strictEqual(room.winner, null);
        assert.strictEqual(room.colorTurn, "cross");
        assert.strictEqual(room.gameState.length, 9);
        assert.ok(room.gameState.every((s) => s === "empty"));

        // cleanup
        await RoomCollection.removeAsync(room._id);
      });
    });

    describe("joinRoom", function () {
      it("decrements capacity on join", async function () {
        const room = await Meteor.callAsync("createRoom");
        const { room: updated } = await Meteor.callAsync("joinRoom", {
          roomId: room._id,
        });
        assert.strictEqual(updated.capacity, 1);

        // cleanup
        await RoomCollection.removeAsync(room._id);
      });
    });
  }
});
