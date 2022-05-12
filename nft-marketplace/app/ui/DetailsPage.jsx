import React from 'react';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { Button } from "./components/Button";
import { RoutePaths } from "./common/RoutePaths";
import {Link, useNavigate, useParams} from "react-router-dom";
import truncateEthAddress from "truncate-eth-address";
import { usePriceConverter } from "./util/usePriceConverter";
import { CurrentAccount } from "./common/CurrentAccount";

import {
  marketplaceAddress
} from '../../config'

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function DetailsPage() {
  const [nft, setNft] = useState(null);
  const [loadingState, setLoadingState] = useState('not-loaded');
  const [sellItem, setSellItem] = useState(false);
  const [formInput, setFormInput] = useState({ price: '0' });
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { converterData } = usePriceConverter();
  const currentAccount = CurrentAccount()?.toLowerCase() || null;
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
        seller: data.seller.toLowerCase(),
        owner: data.owner.toLowerCase(),
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

  async function listNFTForSale(nft) {
    if (!formInput.price) return;
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const priceFormatted = ethers.utils.parseUnits(formInput.price, 'ether');
    let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer);
    let listingPrice = await contract.getListingPrice();

    listingPrice = listingPrice.toString();
    let transaction = await contract.resellToken(nft.tokenId, priceFormatted, { value: listingPrice });
    await transaction.wait();
    await loadNFT();
    setSellItem(false);
  }

  async function unlistNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer);
    let transaction = await contract.unlistToken(nft.tokenId);
    await transaction.wait();
    await loadNFT();
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
                  <p className="text-p text-manatee mt-2 mb-8">Owned by <Link className="text-dodger" to={`${RoutePaths.ACCOUNT}/${nft.owner}`}>{truncateEthAddress(nft.owner)}</Link></p>

                  {nft.owner === marketplaceAddress.toLowerCase() && nft.seller === currentAccount && (
                    <>
                      <Button className="mb-2" text="Remove Listing" type="danger" onClick={() => { unlistNFT(nft) }} />
                      <p className="text-p text-manatee font-light">This will remove the item from the general listing.</p>
                      <p className="text-p text-manatee font-light">Other people will no longer be able to buy it.</p>
                    </>
                  )}

                  {nft.owner === marketplaceAddress.toLowerCase() && nft.seller !== currentAccount && (
                    <>
                      <div className="flex items-baseline">
                        <h2 className="text-h2 text-rhino font-bold mr-2">{nft.price} ETH</h2>
                        {converterData?.ethereum?.usd && <h4 className="text-h4 text-manatee font-bold">${+(converterData.ethereum.usd * nft.price).toFixed(15)}</h4>}
                      </div>

                      <Button className="mt-4" text="Buy with Metamask" onClick={() => { buyNft(nft) }} />
                    </>
                  )}

                  {nft.owner !== marketplaceAddress.toLowerCase() && nft.owner === currentAccount && !sellItem && (
                    <>
                      <Button className="mb-2" text="Sell Item" type="secondary" onClick={() => { setSellItem(true) }} />
                      <p className="text-p text-manatee font-light">Items you own can be listed for sale.</p>
                      <p className="text-p text-manatee font-light">Click “Sell Item” to get started.</p>
                    </>
                  )}

                  {sellItem && (
                    <div className="flex items-center">
                      <input
                        placeholder="Price in ETH"
                        className="border-2 border-porcelain rounded-lg px-4 py-5 mr-4"
                        onChange={e => setFormInput({ ...formInput, price: e.target.value })}
                      />
                      <Button text="Create Listing" type="secondary" onClick={() => { listNFTForSale(nft) }} />
                    </div>
                  )}

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
