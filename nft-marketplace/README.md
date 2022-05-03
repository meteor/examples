# NFT Marketplace

This is from Nader's tutorial, but with Meteor. You can check the original tutorial here: https://dev.to/edge-and-node/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb

To run it locally, you will need to open two terminals.

In terminal #1, you will run the following command:

`npx hardhat node`

The command above will give you 20 accounts with 10000 ETH each, that you can add to your Metamask and test the application locally.

In terminal #2, you will then run the following commands:

```
npx hardhat run scripts/deploy.js --network localhost
meteor
```

The command above will deploy the contract and run the Meteor application.
