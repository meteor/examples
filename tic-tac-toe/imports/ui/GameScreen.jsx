import "./game.css";
import React, { useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTracker, useFind } from "meteor/react-meteor-data";
import { RoomCollection } from "../api/rooms";

const Slot = ({ id, room: { gameState, _id } }) => {
  const location = useLocation();
  const color = location.state?.color;
  return (
    <div
      className="slot"
      onClick={async () => {
        try {
          await Meteor.callAsync("makePlay", {
            roomId: _id,
            playState: { play: id - 1, color },
          });
        } catch (e) {
          if (e.error === "invalid-play") {
            alert(
              "This move is invalid. You might need to wait for your turn!"
            );
          } else {
            alert(e.message);
          }
        }
      }}
    >
      {gameState[id - 1] === "cross" ? <img src={"/cross.png"} /> : ""}
      {gameState[id - 1] === "circle" ? <img src={"/circle.png"} /> : ""}
    </div>
  );
};

export const GameScreen = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const color = location.state?.color;
  const roomLoading = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    const handle = Meteor.subscribe("room", { _id: id });
    return !handle.ready();
  }, [id]);
  const [room] = useFind(() => RoomCollection.find({ _id: id }), [id]);

  useEffect(() => {
    if (room && room.winner) {
      alert(room.winner === color ? "You Won!" : "You Lost!!");
      navigate("/");
    }
  }, [room]);

  if (roomLoading) return "Loading...";

  return (
    <div className="game">
      <div className="line">
        <Slot id={1} room={room} />
        <Slot id={2} room={room} />
        <Slot id={3} room={room} />
      </div>
      <div className="line">
        <Slot id={4} room={room} />
        <Slot id={5} room={room} />
        <Slot id={6} room={room} />
      </div>
      <div className="line">
        <Slot id={7} room={room} />
        <Slot id={8} room={room} />
        <Slot id={9} room={room} />
      </div>
    </div>
  );
};
