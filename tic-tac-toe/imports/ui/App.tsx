import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GameScreen } from "/imports/ui/GameScreen";
import { RoomList } from "/imports/ui/RoomList";
import { Layout } from "/imports/ui/Layout";

export const App = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/game/:id" element={<GameScreen />} />
        <Route path="/" element={<RoomList />} />
      </Routes>
    </Layout>
  </Router>
);
