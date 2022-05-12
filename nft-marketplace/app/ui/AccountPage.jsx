import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from "./components/Card";
import { useParams } from "react-router-dom";
import truncateEthAddress from "truncate-eth-address";

import {
  marketplaceAddress
} from '../../config'

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json';

export default function MyNftsPage() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');
  const { address } = useParams();
  useEffect(() => {
    loadNFTs()
  }, []);

  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider();
    const signer = provider.getSigner();
    const marketplaceContract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer);
    const data = await marketplaceContract.fetchAllNFTsFromUser(address);

    const items = await Promise.all(data.map(async i => {
      const tokenURI = await marketplaceContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenURI);
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      const badge = (i.owner.toLowerCase() === address.toLowerCase()) ? "owned" : "for sale";
      let item = {
        price,
        badge,
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
        <h2 className="text-h2 text-rhino font-bold">No items in this account</h2>
      ) : (
        <>
          <img className="w-20 h-20 mx-auto rounded-r-full" src="/images/default-profile-avatar.png" alt="Profile avatar"/>
          <h1 className="text-h1 text-rhino text-center font-bold mb-7 mt-4">{truncateEthAddress(address)}</h1>
          <h2 className="text-h2 text-rhino font-bold mb-8">{nfts.length} item{nfts.length > 1? 's' : ''}</h2>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full container mx-auto">
            {nfts.map((nft) => (
              <Card
                key={nft.tokenId}
                itemImg={nft.image}
                itemName={nft.name}
                itemPrice={nft.price}
                itemId={nft.tokenId}
                badge={nft.badge}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
