import React from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GameScreen } from "./GameScreen";
import { RoomList } from "./RoomList";

export const App = () => (
  <Router>
    <Routes>
      <Route path="/game/:id" element={<GameScreen />} />
      <Route path="/" element={<RoomList />} />
    </Routes>
  </Router>
);
