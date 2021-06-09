import React from "react";
import { Hello } from "./Hello.jsx";
import { Info } from "./Info.jsx";

import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { GameScreen } from "./GameScreen";
import { RoomList } from "./RoomList";

export const App = () => (
  <Router>
    <Switch>
      <Route path="/game/:id">
        <GameScreen />
      </Route>
      <Route path="/">
        <RoomList />
      </Route>
    </Switch>
  </Router>
);
