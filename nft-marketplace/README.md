# NFT Marketplace

An NFT marketplace built with Meteor and Ethereum. Based on [Nader's tutorial](https://dev.to/edge-and-node/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb), adapted to run on Meteor 3.4 with Rspack. Users can mint, list, and buy NFTs using MetaMask and IPFS for storage.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.4 |
| Frontend | React 18 |
| Styling | Tailwind CSS 3, Headless UI, Heroicons |
| Smart Contracts | Solidity, Hardhat, OpenZeppelin |
| Blockchain | Ethereum (localhost or Polygon Mumbai) |
| Web3 | Ethers.js v5, Web3Modal |
| Storage | IPFS (via ipfs-http-client) |
| Build | Rspack |

## Running it locally

You need two terminals.

**Terminal 1** — start a local Hardhat node:
```bash
meteor npm install
npx hardhat node
```
This gives you 20 accounts with 10000 ETH each. Copy a private key for MetaMask.

**Terminal 2** — deploy contracts and start Meteor:
```bash
npx hardhat run scripts/deploy.js --network localhost
npm start
```

Visit `http://localhost:3000/`.

| Command | What it does |
|---|---|
| `npm start` | Start the Meteor app |
| `npm test` | Integration tests (Mocha) |
| `npm run test-app` | Full-app tests (Mocha, watch mode) |
| `npm run visualize` | Bundle analyzer in production mode |

## MetaMask setup

### Adding a local wallet

1. Make sure MetaMask is set to the **Localhost 8545** network
2. Click the account icon, then **Import Account**
3. Paste one of the private keys from `npx hardhat node`

### Resetting accounts

If you get "Nonce too high" errors during transactions:
1. Open MetaMask settings
2. Go to **Advanced**
3. Click **Reset Accounts**

## Testing the deployed version

A deployed version is available at: https://meteor-nft-marketplace.meteorapp.com

To use it, add the **Mumbai Testnet** to MetaMask:

| Field | Value |
|---|---|
| Network Name | Mumbai TestNet |
| RPC URL | https://rpc-mumbai.maticvigil.com |
| Chain ID | 80001 |
| Currency Symbol | Matic |

You can get testnet Matic tokens from the [Polygon faucet](https://faucet.matic.network/).

## Deployment

- **[Galaxy](https://galaxycloud.app/)**: `meteor deploy your-app.meteorapp.com`
  - To try it quickly with a free tier and shared MongoDB: `meteor deploy your-app.meteorapp.com --free --mongo`
  - Note: smart contracts need to be deployed separately to a public network (Polygon Mumbai, etc.)
- **Any Node.js host**: `meteor build` gives you a standard Node bundle
- **MUP**: automated deploy to your own server over SSH

## Links

- [Meteor docs](https://docs.meteor.com/) · [Meteor guide](https://guide.meteor.com/)
- [React docs](https://react.dev/)
- [Hardhat](https://hardhat.org/) · [Ethers.js](https://docs.ethers.org/v5/) · [Tailwind CSS](https://tailwindcss.com/)
- [Original tutorial](https://dev.to/edge-and-node/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb)
