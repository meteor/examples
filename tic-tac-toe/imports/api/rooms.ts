import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";

export type PlayerColor = "cross" | "circle";
export type Cell = PlayerColor | "empty";

export interface Room {
  _id: string;
  createdAt: Date;
  capacity: number;
  gameState: Cell[];
  colorTurn: PlayerColor;
  winner: PlayerColor | null;
}

export interface JoinRoomResult {
  room: Room;
  color: PlayerColor;
}

export const RoomCollection = new Mongo.Collection<Room>("rooms");

function checkEndGame(gameState: Cell[]) {
  const sameColor = (x: number, y: number, z: number) =>
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
  async createRoom() {
    const roomId = await RoomCollection.insertAsync({
      createdAt: new Date(),
      capacity: 2,
      gameState: new Array(9).fill("empty"),
      colorTurn: "cross",
      winner: null,
    });
    return RoomCollection.findOneAsync(roomId);
  },
  async joinRoom({ roomId }: { roomId: string }): Promise<JoinRoomResult> {
    await RoomCollection.updateAsync(
      { _id: roomId, capacity: { $gte: 1 } },
      { $inc: { capacity: -1 } }
    );
    const room = await RoomCollection.findOneAsync(roomId);
    if (!room) {
      throw new Meteor.Error("Room not found, or full!");
    }
    return {
      room,
      color: room.capacity === 1 ? "cross" : "circle",
    };
  },
  async makePlay({ roomId, playState: { color, play } }: {
    roomId: string;
    playState: { color: PlayerColor; play: number };
  }) {
    const otherColor = color === "cross" ? "circle" : "cross";
    const query: Mongo.Selector<Room> = {
      _id: roomId,
      colorTurn: color,
      winner: null,
      [`gameState.${play}`]: "empty",
    };
    await RoomCollection.updateAsync(query, {
      $set: { colorTurn: otherColor, [`gameState.${play}`]: color },
    });
    const room = await RoomCollection.findOneAsync(roomId);

    if (!room) {
      throw new Meteor.Error("invalid-play");
    }
    const winner = checkEndGame(room.gameState);
    if (winner && winner !== "empty") {
      await RoomCollection.updateAsync(roomId, { $set: { winner } });
      return await RoomCollection.findOneAsync(roomId);
    }

    return room;
  },
});
