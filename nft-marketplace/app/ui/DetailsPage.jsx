import React from 'react';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { Button } from "./components/Button";
import { RoutePaths } from "./common/RoutePaths";
import { useNavigate, useParams } from "react-router-dom";
import truncateEthAddress from "truncate-eth-address";
import { usePriceConverter } from "./util/usePriceConverter";

import {
  marketplaceAddress
} from '../../config'

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function DetailsPage() {
  const [nft, setNft] = useState(null);
  const [loadingState, setLoadingState] = useState('not-loaded');
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { converterData } = usePriceConverter();
  useEffect(() => {
    loadNFT();
  }, []);

  async function loadNFT() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider();
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, provider);
    const data = await contract.fetchMarketItem(itemId);

    if (data) {
      const tokenUri = await contract.tokenURI(data.tokenId);
      const meta = await axios.get(tokenUri);
      let price = ethers.utils.formatUnits(data.price.toString(), 'ether');
      let nftData = {
        price,
        tokenId: data.tokenId.toNumber(),
        seller: data.seller,
        owner: data.owner,
        sold: data.sold,
        image: meta.data.image,
        name: meta.data.name,
        id: meta.data.id,
        description: meta.data.description,
      };
      setNft(nftData);
      setLoadingState('loaded');
    }
  }

  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer);

    /* user will be prompted to pay the asking process to complete the transaction */
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price
    });
    await transaction.wait();
    navigate(RoutePaths.ROOT);
  }

  return (
    <>
      <div className="max-w-7xl mx-auto mt-16 pt-2.5 px-2 sm:px-6 lg:px-8">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 w-full container mx-auto">
          {loadingState === 'loaded' && (
            nft ? (
              <>
                <div className="col-span-1">
                  <img src={nft.image} alt="NFT image"/>
                </div>

                <div className="col-span-2">
                  <h2 className="text-h2 text-rhino font-bold">{nft.name}</h2>
                  <p className="text-p text-manatee mt-2">Owned by <span className="text-dodger">{truncateEthAddress(nft.owner)}</span></p>
                  <div className="flex items-baseline mt-8">
                    <h2 className="text-h2 text-rhino font-bold mr-2">{nft.price} ETH</h2>
                    {converterData?.ethereum?.usd && <h4 className="text-h4 text-manatee font-bold">${+(converterData.ethereum.usd * nft.price).toFixed(15)}</h4>}
                  </div>
                  <Button className="mt-4" text="Buy with Metamask" disabled={nft.sold} onClick={() => { buyNft(nft) }} />

                  {nft.description && (
                    <>
                      <h5 className="text-h5 text-rhino font-bold mt-12">Description</h5>
                      <p className="text-p text-rhino font-light mt-3">{nft.description}</p>
                    </>
                  )}

                  <h5 className="text-h5 text-rhino font-bold mt-4">Properties</h5>
                  <p className="text-p text-manatee font-light mt-3">Seller: <span className="text-rhino">{truncateEthAddress(nft.seller)}</span></p>
                  <p className="text-p text-manatee font-light mt-3">Token ID: <span className="text-rhino">{nft.tokenId}</span></p>
                </div>
              </>
            ) : (
              <h2 className="text-h2 text-rhino font-bold">Invalid NFT</h2>
            )
          )}
        </div>
      </div>
    </>
  );
}
