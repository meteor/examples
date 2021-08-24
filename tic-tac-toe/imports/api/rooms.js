import { Mongo } from "meteor/mongo";

export const RoomCollection = new Mongo.Collection("rooms");

function checkEndGame(gameState) {
  const sameColor = (x, y, z) =>
    new Set([gameState[x - 1], gameState[y - 1], gameState[z - 1]]).size ===
      1 &&
    gameState[x - 1] !== "empty" &&
    gameState[x - 1];
  return (
    sameColor(1, 2, 3) ||
    sameColor(4, 5, 6) ||
    sameColor(7, 8, 9) ||
    sameColor(1, 4, 7) ||
    sameColor(2, 5, 8) ||
    sameColor(3, 6, 9) ||
    sameColor(1, 5, 9) ||
    sameColor(3, 5, 7)
  );
}

Meteor.methods({
  createRoom() {
    const roomId = RoomCollection.insert({
      createdAt: new Date(),
      capacity: 2,
      gameState: new Array(9).fill("empty"),
      colorTurn: "cross",
      winner: null
    });
    return RoomCollection.findOne(roomId);
  },
  joinRoom({ roomId }) {
    const room = RoomCollection.findAndModify({
      query: { _id: roomId, capacity: { $gte: 1 } },
      update: { $inc: { capacity: -1 } },
      new: true
    });
    if (!room) {
      throw new Error("Room not found, or full!");
    }
    return {
      room: RoomCollection.findOne(roomId),
      color: room.capacity === 1 ? "cross" : "circle"
    };
  },
  makePlay({ roomId, playState: { color, play } }) {
    const otherColor = color === "cross" ? "circle" : "cross";
    const query = {
      _id: roomId,
      colorTurn: color,
      winner: null,
      [`gameState.${play}`]: "empty"
    };
    console.log(query);
    const room = RoomCollection.findAndModify({
      query,
      update: { $set: { colorTurn: otherColor, [`gameState.${play}`]: color } },
      new: true
    });

    if (!room) {
      throw new Meteor.Error("invalid-play");
    }
    const winner = checkEndGame(room.gameState);
    if (winner && winner !== "empty") {
      return RoomCollection.findAndModify({
        query: { _id: roomId },
        update: { $set: { winner } },
        new: true
      });
    }

    return room;
  }
});
