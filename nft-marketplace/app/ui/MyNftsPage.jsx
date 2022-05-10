import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { Card } from "./components/Card";

import {
  marketplaceAddress
} from '../../config'

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'
import truncateEthAddress from "truncate-eth-address";

export default function MyNftsPage() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');
  useEffect(() => {
    loadNFTs()
  }, []);

  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const marketplaceContract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer);
    const data = await marketplaceContract.fetchMyNFTs();

    const items = await Promise.all(data.map(async i => {
      const tokenURI = await marketplaceContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenURI);
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        name: meta.data.name,
        image: meta.data.image,
        tokenURI
      };

      return item;
    }));
    setNfts(items);
    setLoadingState('loaded');
  }

  return (
    <div className="max-w-7xl mx-auto mt-16 pt-2.5 px-2 sm:px-6 lg:px-8">
      {(loadingState === 'loaded' && !nfts.length) ? (
        <h2 className="text-h2 text-rhino font-bold">No items in your account</h2>
      ) : (
        <>
          <h2 className="text-h2 text-rhino font-bold mb-8">{nfts.length} item{nfts.length > 1? 's' : ''}</h2>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full container mx-auto">
            {nfts.map((nft) => (
              <Card key={nft.tokenId} itemImg={nft.image} itemName={nft.name} itemPrice={nft.price} itemId={nft.tokenId} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
