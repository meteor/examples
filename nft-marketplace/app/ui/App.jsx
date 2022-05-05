import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from "./common/NavBar";

export const App = () => (
  <>
    <NavBar />
    <Outlet />
  </>
);
