import React from 'react';
import { ethers } from "ethers";

export const CurrentAccount = () => {
  if (window.ethereum !== undefined) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    return provider.provider.selectedAddress;
  }

  return null;
}
