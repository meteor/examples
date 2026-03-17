import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { GameScreen } from "/imports/ui/GameScreen";
import { RoomList } from "/imports/ui/RoomList";
import { Layout } from "/imports/ui/Layout";

export const App = () => (
  <Router>
    <Layout>
      <Switch>
        <Route path="/game/:id">
          <GameScreen />
        </Route>
        <Route path="/">
          <RoomList />
        </Route>
      </Switch>
    </Layout>
  </Router>
);
