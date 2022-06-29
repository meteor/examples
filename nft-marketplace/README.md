# NFT Marketplace

This is from Nader's tutorial, but with Meteor. You can check the original tutorial here: https://dev.to/edge-and-node/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb

To run it locally, you will need to open two terminals.

But first, you need to clone the project and run a `meteor npm install` to install all the dependencies.

In terminal #1, you will run the following command:

`npx hardhat node`

The command above will give you 20 accounts with 10000 ETH each, that you can add to your Metamask and test the application locally.

In terminal #2, you will then run the following commands:

```
npx hardhat run scripts/deploy.js --network localhost
meteor
```

The command above will deploy the contract and run the Meteor application.

## Adding a wallet to MetaMask

The `npx hardhat node` command will give you 20 accounts for you to test locally. To add one of these accounts to your Metamask, you will need to copy one of the private keys hardhat gave you.

Then you will make sure you are in the localhost network, like in the screenshot below:

![metamask network](https://user-images.githubusercontent.com/41165990/170504915-dfe5e75b-f4d2-423f-90a7-d856af49a6a2.png)

After that, you will click in the top right icon to open a menu, where you will click on Import Account, like in the image below:

![metamask wallet 1](https://user-images.githubusercontent.com/41165990/170505136-75fbd41b-af46-4d54-8d0a-bd15eacd2765.png)

Then you will paste your private key and click Import.

## Possible issues when testing locally

If you're getting errors like "Nonce too high" when trying to add an NFT or doing any kind of transaction in the app, you can do the following steps:

1. Access the top right menu like you did in the last section
2. Go to Settings and then Advanced
3. Click on Reset Accounts

## Screenshots of the application

![Screenshot 2022-05-25 at 11-23-41 Dummy Page](https://user-images.githubusercontent.com/41165990/170509257-e4adabaa-c0d4-4d4d-9fb5-4a4e851f365e.png)

![Screenshot 2022-06-28 at 23-51-54 Dummy Page](https://user-images.githubusercontent.com/41165990/176348036-67f4d3fd-8eba-4cde-bacb-c14abecef9ed.png)

![Screenshot 2022-06-28 at 23-52-15 Dummy Page](https://user-images.githubusercontent.com/41165990/176348065-05ef0658-3366-4eca-bbf8-db729b057b19.png)

![Screenshot 2022-06-28 at 23-53-22 Dummy Page](https://user-images.githubusercontent.com/41165990/176348085-3896af2b-2e36-41d1-9df5-e1e7de7c7d98.png)

![Screenshot 2022-06-28 at 23-54-11 Dummy Page](https://user-images.githubusercontent.com/41165990/176348099-baadb92b-9a8b-4db0-ae47-ccce00e02625.png)
