import React, { useEffect, useState} from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from "./common/NavBar";

export const App = () => {
  const [connection, setConnection] = useState(false);
  useEffect(() => {
    window.ethereum.on("accountsChanged", accounts => {
      if (accounts.length > 0) setConnection(true);
      else setConnection(false);
    });
  }, []);

  return (
    <>
      <NavBar connection={connection} />
      <Outlet context={[connection, setConnection]} />
    </>
  );
};
