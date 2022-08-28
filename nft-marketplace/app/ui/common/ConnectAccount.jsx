import React from "react";
import Web3Modal from "web3modal";

export const ConnectAccount = async () => {
  const web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
  });

  return await web3Modal.connect();
}

