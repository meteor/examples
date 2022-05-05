import React from 'react';
import { BrowserRouter, Routes as ReactRoutes, Route } from 'react-router-dom';
import { App } from "../App";

const HomePage = React.lazy(() => import('../HomePage'));

export const RoutePaths = {
  ROOT: '/',
};

export const Routes = () => (
  <BrowserRouter>
    <ReactRoutes>
      <Route path={RoutePaths.ROOT} element={<App />}>
        <Route index element={<HomePage />} />
      </Route>
    </ReactRoutes>
  </BrowserRouter>
);
