import React from 'react';
import { Button } from "./components/Button";
import { ConnectAccount } from "./common/ConnectAccount";
import { useOutletContext } from "react-router-dom";

export default function ConnectPage() {
  const [connection, setConnection] = useOutletContext();

  return (
    <div className="text-center max-w-7xl mx-auto mt-14 pt-1 px-2 sm:px-6 lg:px-8">
      <h2 className="text-h2 text-rhino font-bold text-center">Connect with your MetaMask wallet</h2>
      <p className="text-p mt-4">You need an Ethereum wallet to use this store.</p>
      <img className="mt-10 mx-auto" src="images/metamask-logo.png" alt="Metamask logo"/>
      <Button
        className="mt-10"
        text={connection ? 'Already Connected' : 'Connect with Metamask'}
        disabled={connection}
        onClick={() => {
          ConnectAccount().then(() => {
            setConnection(true)
          }, () => {
            setConnection(false)
          });
        }} />
    </div>
  )
}
