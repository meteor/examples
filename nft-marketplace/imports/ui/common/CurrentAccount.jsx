import React from 'react';
import { ethers } from "ethers";

export const CurrentAccount = () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  return provider.provider.selectedAddress;
}
