import React from 'react';
import { BrowserRouter, Routes as ReactRoutes, Route } from 'react-router-dom';
import { RoutePaths } from './RoutePaths';
import { App } from "../App";

const HomePage = React.lazy(() => import('../HomePage'));
const SellNftPage = React.lazy(() => import('../SellNftPage'));

export const Routes = () => (
  <BrowserRouter>
    <ReactRoutes>
      <Route path={RoutePaths.ROOT} element={<App />}>
        <Route index element={<HomePage />} />
        <Route path={RoutePaths.SELL_NFT} element={<SellNftPage />} />
      </Route>
    </ReactRoutes>
  </BrowserRouter>
);
