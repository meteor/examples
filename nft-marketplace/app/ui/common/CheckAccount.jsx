import React from "react";
import { ethers } from "ethers";

export const CheckAccount = () => {
  const provider = new ethers.providers.Web3Provider(
    window.ethereum
  );

  return provider.listAccounts();
}

