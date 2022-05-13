import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from "./components/Card";
import { useParams, useLocation } from "react-router-dom";
import truncateEthAddress from "truncate-eth-address";
import { SortOptions } from "./common/SortOptions";
import { Select } from "./components/Select";
import { CategoryOptions } from "./common/CategoryOptions";

import {
  marketplaceAddress
} from '../../config'

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json';

export default function MyNftsPage() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');
  const [category, setCategory] = useState(CategoryOptions[0].value);
  const [sortBy, setSortBy] = useState(SortOptions[0].value);
  const { address } = useParams();
  const location = useLocation();
  useEffect(() => {
    loadNFTs()
  }, [location, category, sortBy]);

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
      const badge = (i.owner.toLowerCase() === address.toLowerCase() && i.owner.toLowerCase() !== marketplaceAddress.toLowerCase()) ? "owned" : "for sale";
      let item = {
        price,
        badge,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller.toLowerCase(),
        owner: i.owner.toLowerCase(),
        name: meta.data.name,
        image: meta.data.image,
        tokenURI
      };

      return item;
    }));

    let filteredItems = items;

    if (category === 'owned') {
      filteredItems = items.filter((item) => item.badge === 'owned' );
    } else if (category === 'for-sale') {
      filteredItems = items.filter((item) => item.badge === 'for sale' );
    }

    if (sortBy === 'oldest') {
      filteredItems.sort((a,b) => a.tokenId - b.tokenId);
    } else if (sortBy === 'newest') {
      filteredItems.sort((a,b) => b.tokenId - a.tokenId);
    } else if (sortBy === 'price-low') {
      filteredItems.sort((a,b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filteredItems.sort((a,b) => b.price - a.price);
    }

    setNfts(filteredItems);
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

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-h2 text-rhino font-bold">{nfts.length} item{nfts.length > 1? 's' : ''}</h2>

            <div className="flex items-center">
              <Select className="mr-4" onChange={e => setCategory(e.target.value)}>
                {CategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
              <Select onChange={e => setSortBy(e.target.value)}>
                {SortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
          </div>

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
