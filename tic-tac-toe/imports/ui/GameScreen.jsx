import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTracker, useFind } from "meteor/react-meteor-data";
import { RoomCollection } from "../api/rooms";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Zoom from "@mui/material/Zoom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

const CROSS_COLOR = "#1e88e5";
const CIRCLE_COLOR = "#e53935";

const Slot = ({ index, value, onPlay }) => (
  <Paper
    elevation={2}
    onClick={onPlay}
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: value === "empty" ? "pointer" : "default",
      transition: "background-color 0.2s",
      "&:hover": value === "empty" ? { bgcolor: "action.hover" } : {},
    }}
  >
    {value === "cross" && (
      <Zoom in>
        <CloseIcon sx={{ fontSize: 64, color: CROSS_COLOR }} />
      </Zoom>
    )}
    {value === "circle" && (
      <Zoom in>
        <RadioButtonUncheckedIcon sx={{ fontSize: 64, color: CIRCLE_COLOR }} />
      </Zoom>
    )}
  </Paper>
);

export const GameScreen = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { color } = location.state;
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const roomLoading = useTracker(() => {
    const handle = Meteor.subscribe("room", { _id: id });
    return !handle.ready();
  }, [id]);
  const [room] = useFind(() => RoomCollection.find({ _id: id }), [id]);

  if (roomLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isMyTurn = room.colorTurn === color;
  const gameOver = !!room.winner;
  const won = room.winner === color;

  const handlePlay = async (index) => {
    if (gameOver) return;
    try {
      await Meteor.callAsync("makePlay", {
        roomId: room._id,
        playState: { play: index, color },
      });
    } catch (e) {
      const message =
        e.error === "invalid-play"
          ? "Invalid move. You might need to wait for your turn!"
          : e.message;
      setSnackbar({ open: true, message });
    }
  };

  return (
    <>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 2 }}
      >
        Back to Rooms
      </Button>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Chip
          icon={color === "cross" ? <CloseIcon /> : <RadioButtonUncheckedIcon />}
          label={`You are ${color === "cross" ? "X" : "O"}`}
          variant="outlined"
          sx={{
            borderColor: color === "cross" ? CROSS_COLOR : CIRCLE_COLOR,
            color: color === "cross" ? CROSS_COLOR : CIRCLE_COLOR,
          }}
        />
        {!gameOver && (
          <Chip
            label={isMyTurn ? "Your turn" : "Opponent's turn"}
            color={isMyTurn ? "success" : "default"}
            size="small"
          />
        )}
      </Box>

      {room.capacity === 1 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Waiting for another player to join. Share this room or open a new
          browser tab and join from the room list.
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            width: 360,
            height: 360,
            maxWidth: "100%",
            aspectRatio: "1",
          }}
        >
          {room.gameState.map((value, index) => (
            <Slot
              key={index}
              index={index}
              value={value}
              onPlay={() => handlePlay(index)}
            />
          ))}
        </Box>
      </Box>

      <Dialog open={gameOver} maxWidth="xs" fullWidth>
        <DialogTitle>Game Over!</DialogTitle>
        <DialogContent>
          <Typography
            variant="h5"
            sx={{ color: won ? "success.main" : "text.secondary", mt: 1 }}
          >
            {won ? "You Won!" : "You Lost!"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/")} variant="contained">
            Back to Rooms
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: "" })}
      >
        <Alert
          severity="error"
          onClose={() => setSnackbar({ open: false, message: "" })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
