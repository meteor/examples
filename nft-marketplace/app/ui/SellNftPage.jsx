import React, { useEffect, useState} from 'react';
import { ethers } from 'ethers';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Web3Modal from 'web3modal';
import { RoutePaths } from "./common/RoutePaths";
import {useNavigate, useOutletContext} from 'react-router-dom';
import { Button } from "./components/Button";
import { InputField } from "./components/Fields/InputField";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

import {
  marketplaceAddress
} from '../../config';

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json';

export default function SellNftPage() {
  const navigate = useNavigate();
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' });
  const [connection, setConnection] = useOutletContext();
  useEffect(() => {
    if (!connection) {
      navigate(RoutePaths.CONNECT);
    }
  }, [connection]);

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
        <label htmlFor="file" className="flex relative">
          <input
            type="file"
            name="Asset"
            className="file:hidden w-full border-2 border-porcelain bg-white text-manatee rounded-lg px-4 py-5"
            id="file"
            onChange={onChange}
          />

          <Button className="bg-rhino absolute top-1 right-1 bottom-1" text="Upload" onClick={(e) => document.querySelector('#file').click()} />
        </label>

        <p className="text-p text-manatee mt-2">Supported file types: JPG, GIF, PNG, list all supported types here. Max 50 Mb</p>

        <InputField
          name='name'
          label="Name"
          value={formInput.name}
          classNameContainer="mt-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />

        <InputField
          name='price'
          label="Price in MATIC"
          value={formInput.price}
          classNameContainer="mt-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />

        <InputField
          textArea
          name='description'
          label="Description (optional)"
          value={formInput.description}
          classNameContainer="mt-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />

        <p className="text-p text-manatee mt-2">Description will be included on the item details page next to the image.</p>

        <Button className="mt-4" text="Create" onClick={listNFTForSale} />
      </div>
    </div>
  )
}
