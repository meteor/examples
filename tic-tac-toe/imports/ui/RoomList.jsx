import React, { useState } from "react";
import { useSubscribe, useFind } from "meteor/react-meteor-data";
import { useNavigate } from "react-router-dom";
import { RoomCollection } from "../api/rooms";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Snackbar from "@mui/material/Snackbar";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const getRoomStatus = (capacity, winner) => {
  if (winner) return { label: `Winner: ${winner}`, color: "secondary", icon: <EmojiEventsIcon /> };
  if (capacity === 2) return { label: "Open", color: "success" };
  if (capacity === 1) return { label: "Waiting for opponent", color: "warning" };
  return { label: "In Progress", color: "info" };
};

export const RoomList = () => {
  const navigate = useNavigate();
  const listLoading = useSubscribe("rooms");
  const rooms = useFind(() => RoomCollection.find({}, { sort: { createdAt: -1 } }), []);
  const [error, setError] = useState(null);

  if (listLoading()) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Game Rooms
      </Typography>

      <Alert severity="info" icon={<PeopleIcon />} sx={{ mb: 3 }}>
        <AlertTitle>How to Play</AlertTitle>
        This is a two-player game. Open this app in{" "}
        <strong>two separate browser tabs</strong>. Create a room in one tab,
        then join the same room from both tabs to start playing.
      </Alert>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ mb: 3 }}
        onClick={async () => {
          await Meteor.callAsync("createRoom");
        }}
      >
        Create Room
      </Button>

      {rooms.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No rooms yet. Create one to get started!
        </Typography>
      )}

      <Stack spacing={2}>
        {rooms.map(({ _id, capacity, winner }) => {
          const status = getRoomStatus(capacity, winner);
          return (
            <Card key={_id} variant="outlined">
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Room ...{_id.slice(-4)}
                </Typography>
                <Chip
                  label={status.label}
                  color={status.color}
                  size="small"
                  icon={status.icon}
                />
              </CardContent>
              <CardActions>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={capacity <= 0}
                  onClick={() => {
                    Meteor.callAsync("joinRoom", { roomId: _id })
                      .then(({ room, color }) => {
                        navigate(`/game/${room._id}`, { state: { color } });
                      })
                      .catch((err) => {
                        setError(err.reason || err.message);
                      });
                  }}
                >
                  Join Room
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Stack>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};
