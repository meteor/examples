import { useSubscribe, useFind } from "meteor/react-meteor-data";
import React from "react";
import { RoomCollection } from "../api/rooms";
import { useHistory } from "react-router";

export const RoomList = () => {
  const history = useHistory();
  const listLoading = useSubscribe("rooms");
  const rooms = useFind(() => RoomCollection.find({}), []);

  if (listLoading()) return "Loading...";
  return (
    <div>
      <button
        onClick={async () => {
          await Meteor.callAsync("createRoom");
        }}
      >
        {" "}
        Create Room{" "}
      </button>
      <ul>
        {rooms.map(({ _id, capacity, winner }) => (
          <li key={_id}>
            Room {_id} <br />
            {winner ? `Winner:${winner}` : ""}
            <br />
            <button
              disabled={capacity <= 0}
              onClick={() => {
                Meteor.callAsync("joinRoom", { roomId: _id }).then(
                  ({ room, color }) => {
                    history.push(`/game/${room._id}`, { color });
                  }
                );
              }}
            >
              {" "}
              Join Room{" "}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
