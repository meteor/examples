import React, { useState } from 'react';
import { ethers } from 'ethers';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Web3Modal from 'web3modal';
import { RoutePaths } from "./common/RoutePaths";
import { useNavigate } from 'react-router-dom';
import { Button } from "./components/Button";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

import {
  marketplaceAddress
} from '../../config';

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json';

export default function SellNftPage() {
  const navigate = useNavigate();
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' });

  async function onChange(e) {
    const file = e.target.files[0];
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      );

      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  }

  async function uploadToIPFS() {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after file is uploaded to IPFS, return the URL to use it in the transaction */
      return url;
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  }

  async function listNFTForSale() {
    const url = await uploadToIPFS();
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    /* next, create the item */
    const price = ethers.utils.parseUnits(formInput.price, 'ether');
    let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer);
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();
    let transaction = await contract.createToken(url, price, { value: listingPrice });
    await transaction.wait();

    navigate(RoutePaths.ROOT);
  }

  return (
    <div className="max-w-lg mx-auto mt-14 mb-2.5 px-2 sm:px-0 ">
      <h2 className="text-h2 text-rhino font-bold text-center">Create New Item</h2>

      <div className="mt-20">
        <input
          type="file"
          name="Asset"
          className="w-full border-2 border-porcelain text-manatee rounded-lg p-4"
          onChange={onChange}
        />

        <p className="text-p text-manatee mt-2">Supported file types: JPG, GIF, PNG, list all supported types here. Max 50 Mb</p>

        <input
          placeholder="Name"
          className="w-full mt-4 border-2 border-porcelain rounded-lg px-4 py-5"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />

        <div className="mt-4">
          <input
            placeholder="Price in ETH"
            className="w-full border-2 border-porcelain rounded-lg px-4 py-5"
            onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
          />
        </div>

        <textarea
          placeholder="Description (optional)"
          className="w-full mt-4 border-2 border-porcelain rounded-lg px-4 py-5"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />

        <p className="text-p text-manatee mt-2">Description will be included on the item details page next to the image.</p>

        <Button className="mt-4" text="Create" onClick={listNFTForSale} />
      </div>
    </div>
  )
}
