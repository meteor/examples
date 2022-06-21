import React from "react";
import { ethers } from "ethers";

export const CheckAccount = () => {
  if (window.ethereum !== undefined) {
    const provider = new ethers.providers.Web3Provider(
      window.ethereum
    );

    return provider.listAccounts();
  }

  return null;
}

