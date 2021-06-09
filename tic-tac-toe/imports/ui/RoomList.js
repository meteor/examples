import { useTracker } from "meteor/react-meteor-data";
import React from "react";
import { RoomCollection } from "../api/rooms";
import { useHistory } from "react-router";

export const RoomList = () => {
  const history = useHistory();
  const listLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe("rooms");
    return !handle.ready();
  }, []);
  const rooms = useTracker(() => RoomCollection.find({}).fetch(), []);

  if (listLoading) return "Loading...";
  return (
    <div>
      <button
        onClick={() => {
          Meteor.call("createRoom");
        }}
      >
        {" "}
        Create Room{" "}
      </button>
      <ul>
        {rooms.map(({ _id, capacity, winner }) => (
          <li>
            Room {_id} <br />
            {winner ? `Winner:${winner}` : ""}
            <br />
            <button
              disabled={capacity <= 0}
              onClick={() => {
                Meteor.call(
                  "joinRoom",
                  { roomId: _id },
                  (err, { room, color }) => {
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
