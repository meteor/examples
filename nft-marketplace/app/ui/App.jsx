import React, { useEffect, useState} from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from "./common/NavBar";
import { CheckAccount } from "./common/CheckAccount";
import { Footer } from "./common/Footer";

export const App = () => {
  const [connection, setConnection] = useState(false);

  useEffect(() => {
    if (window.ethereum !== undefined) {
      window.ethereum.on("accountsChanged", accounts => {
        if (accounts.length > 0) setConnection(true);
        else setConnection(false);
      });

      CheckAccount().then((accounts) => {
        if (accounts.length > 0) setConnection(true);
        else setConnection(false);
      })
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar connection={connection}/>
      <div className="grow">
        <Outlet context={[connection, setConnection]}/>
      </div>
      <Footer/>
    </div>
  );
};
