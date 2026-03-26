import React, { useEffect, useState} from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from "./common/NavBar";
import { CheckAccount } from "./common/CheckAccount";
import { Footer } from "./common/Footer";

export const App = () => {
  const [connection, setConnection] = useState(false);

  if (window.ethereum !== undefined) {
    useEffect(() => {
      window.ethereum.on("accountsChanged", accounts => {
        if (accounts.length > 0) setConnection(true);
        else setConnection(false);
      });

      CheckAccount().then((accounts) => {
        if (accounts.length > 0) setConnection(true);
        else setConnection(false);
      })
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
  } else {
    return (
      <div className="text-center max-w-7xl mx-auto mt-14 pt-1 px-2 sm:px-6 lg:px-8">
        <h2 className="text-h2 text-rhino font-bold text-center">You need Metamask installed to use this store.</h2>
        <img className="mt-10 mx-auto" src="images/metamask-logo.png" alt="Metamask logo"/>
      </div>
    );
  }
};
