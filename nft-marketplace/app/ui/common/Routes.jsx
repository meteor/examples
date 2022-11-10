import React from 'react';
import { BrowserRouter, Routes as ReactRoutes, Route } from 'react-router-dom';
import { RoutePaths } from './RoutePaths';
import { App } from "../App";

const HomePage = React.lazy(() => import('../HomePage'));
const SellNftPage = React.lazy(() => import('../SellNftPage'));
const ConnectPage = React.lazy(() => import('../ConnectPage'));
const DetailsPage = React.lazy(() => import('../DetailsPage'));
const AccountPage = React.lazy(() => import('../AccountPage'));

export const Routes = () => (
  <BrowserRouter>
    <ReactRoutes>
      <Route path={RoutePaths.ROOT} element={<App />}>
        <Route index element={<HomePage />} />
        <Route path={RoutePaths.SELL_NFT} element={<SellNftPage />} />
        <Route path={RoutePaths.CONNECT} element={<ConnectPage />} />
        <Route path={`${RoutePaths.DETAILS}/:itemId`} element={<DetailsPage />} />
        <Route path={`${RoutePaths.ACCOUNT}/:address`} element={<AccountPage />} />
      </Route>
    </ReactRoutes>
  </BrowserRouter>
);
