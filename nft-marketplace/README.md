# NFT Marketplace

An NFT marketplace built with Meteor and Ethereum. Based on [Nader's tutorial](https://dev.to/edge-and-node/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb), adapted to run on Meteor 3.4.1-rc.1 with Rspack. Users can mint, list, and buy NFTs using MetaMask and IPFS (via Infura's gateway) for storage.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.4.1-rc.1 |
| Frontend | React 19 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), Headless UI, Heroicons |
| Smart Contracts | Solidity, Hardhat, OpenZeppelin |
| Blockchain | Ethereum (localhost or Polygon Mumbai) |
| Web3 | Ethers.js v5, Web3Modal v1 |
| Storage | IPFS via Infura gateway (`ipfs-http-client`, `https://ipfs.infura.io`) |
| Build | Rspack |

## Running it locally

You need two terminals.

**Terminal 1**, start a local Hardhat node:
```bash
meteor npm install
npx hardhat node
```
This gives you 20 accounts with 10000 ETH each on `localhost:8545` (the default Hardhat port). Copy a private key for MetaMask.

**Terminal 2**, deploy contracts and start Meteor:
```bash
npx hardhat run scripts/deploy.js --network localhost
npm start
```

`scripts/deploy.js` writes the deployed contract address to `config.js` at the project root (auto-generated, imported by the client). Re-run the deploy step whenever you restart the Hardhat node so `config.js` stays in sync.

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

## Running against a public testnet

To run the app against Polygon Mumbai instead of a local Hardhat node, deploy the contract to Mumbai with `npx hardhat run scripts/deploy.js --network mumbai` (after configuring the `mumbai` network in `hardhat.config.js`), and add the network to MetaMask:

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
