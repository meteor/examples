import React from "react";

import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { GameScreen } from "/imports/ui/GameScreen";
import { RoomList } from "/imports/ui/RoomList";

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
