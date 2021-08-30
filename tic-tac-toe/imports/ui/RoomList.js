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
        className="px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform bg-blue-600 rounded-md dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-gray-700 focus:outline-none focus:bg-blue-500 dark:focus:bg-gray-700"
        onClick={() => {
          Meteor.call("createRoom");
        }}
      >
        {" "}
        Create Room{" "}
      </button>
      <div>
        {rooms.map(({ _id, capacity, winner }) => (
          <div className="mt-5 max-w-2xl px-8 py-4 mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-light text-gray-600 dark:text-gray-400">
                Mar 10, 2019
              </span>
            </div>

            <div className="mt-2">
              <a
                href="#"
                className="text-2xl font-bold text-gray-700 dark:text-white hover:text-gray-600 dark:hover:text-gray-200 hover:underline"
              >
                Room {_id}
              </a>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {" "}
                {winner ? `Winner:${winner}` : ""}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                className="px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-200 transform bg-blue-600 rounded-md dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-gray-700 focus:outline-none focus:bg-blue-500 dark:focus:bg-gray-700"
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
                Join Room
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
