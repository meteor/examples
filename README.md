# Meteor examples

With Meteor 3.4 introducing the Rspack bundler, modern build optimizations, and full ESM support, our application examples needed a refresh. We've revamped this repository to reflect the current state of Meteor and showcase what's possible with the latest tools.

These examples serve two purposes: help newcomers get started with a solid foundation, and show existing users how to adopt new features like Rspack, modern UI frameworks, and async patterns in real-world scenarios.

All in-house examples now run on Meteor 3.4.1-rc.1 with Rspack enabled, async MongoDB operations, and modern frontend setups. Each one ships with CI/CD via GitHub Actions, linting, and E2E testing (Playwright or Cypress). Every in-house example is also deployed to a Galaxy sandbox, so you can try the finished product in your browser before cloning the repo.

## Table of contents

- [Official examples](#official-examples)
  - [Simple Tasks](#simple-tasks)
  - [Task Manager](#task-manager)
  - [Notes Offline](#notes-offline)
  - [Simple Blog](#simple-blog)
  - [Tic-Tac-Toe](#tic-tac-toe)
  - [Parties](#parties)
  - [Complex Todos (Svelte)](#complex-todos-svelte)
  - [Welcome Meteor Cordova](#welcome-meteor-cordova)
- [Other examples](#other-examples)
  - [React Tutorial App](#react-tutorial-app)
  - [Blaze Tutorial App](#blaze-tutorial-app)
  - [Solid Tutorial App](#solid-tutorial-app)
  - [Vue 3 Tutorial App](#vue-3-tutorial-app)
  - [Svelte Tutorial App](#svelte-tutorial-app)
  - [NFT Marketplace](#nft-marketplace)
- [How to add your example?](#how-to-add-your-example)
- [Housekeeping](#housekeeping)
- [Join the Meteor Renaissance!](#join-the-meteor-renaissance)

## Official examples

### Simple Tasks
- Repository: [fredmaiaarantes/simpletasks](https://github.com/fredmaiaarantes/simpletasks)
- Demo: https://simpletasks.sandbox.galaxycloud.app/
- Why: A task management app showcasing form handling, user accounts, DB migrations, and a polished component-based UI
- Stack: Meteor, Rspack, Chakra UI, React, Formik, MongoDB
- Last Updated At: Feb/12/2026
- Meteor Version: 3.4

### Task Manager
- Repository: [meteor/examples/task-manager](./task-manager)
- Demo: https://task-manager.sandbox.galaxycloud.app/
- Why: Task management with CRUD, status workflows, priority filtering, real-time dashboard, and type-safe RPC
- Stack: Meteor, Rspack, React, Meteor-RPC, shadcn/ui, Tailwind CSS v4, React Query, Zod, Mocha, Biome, Playwright
- Last Updated At: Apr/21/2026
- Meteor Version: 3.4.1-rc.1

### Notes Offline
- Repository: [meteor/examples/notes-offline](./notes-offline)
- Demo: https://notes-offline.sandbox.galaxycloud.app/
- Why: Offline-first PWA notes app with auto-save, markdown, search, tagging, pinning, trash/recovery, import/export, cross-tab sync, per-device scoping, and multi-language UI (en/es/pt)
- Stack: Meteor, Rspack, React, Mantine UI, jam:offline, jam:method, jam:pub-sub, jam:soft-delete, Zod, Workbox, LinguiJS, Mocha, ESLint, Prettier, Playwright
- Last Updated At: Apr/21/2026
- Meteor Version: 3.4.1-rc.1

### Simple Blog
- Repository: [dupontbertrand/meteor-blog](https://github.com/dupontbertrand/meteor-blog)
- Why: Mini blog with role-based access control, post/comment management, email notifications, and dev-mode mail preview
- Stack: Meteor, Rspack, Blaze 3, Bootstrap 5, Flow Router, MJML
- Last Updated At: Mar/24/2026
- Meteor Version: 3.4

### Tic-Tac-Toe
- Repository: [meteor/examples/tic-tac-toe](./tic-tac-toe)
- Demo: https://tic-tac-toe.sandbox.galaxycloud.app/
- Why: Real-time multiplayer game with room-based matchmaking and live state sync via pub/sub
- Stack: Meteor, Rspack, React, MUI (Material UI), Mocha, oxlint, Playwright
- Last Updated At: Apr/21/2026
- Meteor Version: 3.4.1-rc.1

### Parties
- Repository: [meteor/examples/parties](./parties)
- Demo: https://parties.sandbox.galaxycloud.app/
- Why: One of the original Meteor examples showcasing how to build a nice working application with Blaze with very little code, while taking advantage of optimistic updates
- Stack: Meteor, Rspack, Blaze 3, Bootstrap 5, D3.js, RSLint, Playwright
- Last Updated At: Apr/21/2026
- Meteor Version: 3.4.1-rc.1

### Complex Todos (Svelte)
- Repository: [meteor/examples/complex-todos-svelte](./complex-todos-svelte)
- Demo: https://complex-todos-svelte.sandbox.galaxycloud.app/
- Why: Production-grade todo app with modular monolith architecture, rate limiting, caching, migrations, scheduled jobs, and E2E tests
- Stack: Meteor, Rspack, Svelte 5, Skeleton UI, Tailwind CSS v4, jam:method, Zod, oxlint, Cypress, Mocha, MongoDB
- Last Updated At: Apr/21/2026
- Meteor Version: 3.4.1-rc.1

### Welcome Meteor Cordova
- Repository: [CloudByGalaxy/welcome-meteor-cordova](https://github.com/CloudByGalaxy/welcome-meteor-cordova)
- Why: To show how to set up a Meteor app with Cordova for mobile usage
- Stack: Meteor, Cordova
- Meteor Version: 3.4.1-rc.0

## Other examples

Additional examples covering tutorials, integrations, and specialized use cases.

### React Tutorial App
- Tutorial: [docs.meteor.com/tutorials/react](https://docs.meteor.com/tutorials/react/)
- Repository: [meteor/meteor3-react (3.4-rspack)](https://github.com/meteor/meteor3-react/tree/3.4-rspack)
- Why: Step-by-step tutorial app for learning Meteor fundamentals with React
- Stack: Meteor, Rspack, React
- Meteor Version: 3.4

### Blaze Tutorial App
- Tutorial: [docs.meteor.com/tutorials/blaze](https://docs.meteor.com/tutorials/blaze/)
- Repository: [meteor/meteor3-blaze (3.4-rspack)](https://github.com/meteor/meteor3-blaze/tree/3.4-rspack)
- Why: Step-by-step tutorial app for learning Meteor fundamentals with Blaze
- Stack: Meteor, Rspack, Blaze
- Meteor Version: 3.4

### Solid Tutorial App
- Tutorial: [docs.meteor.com/tutorials/solid](https://docs.meteor.com/tutorials/solid/)
- Repository: [meteor/meteor3-solid (3.4-rspack)](https://github.com/meteor/meteor3-solid/tree/3.4-rspack)
- Why: Step-by-step tutorial app for learning Meteor fundamentals with Solid
- Stack: Meteor, Rspack, Solid
- Meteor Version: 3.4

### Vue 3 Tutorial App
- Tutorial: [docs.meteor.com/tutorials/vue](https://docs.meteor.com/tutorials/vue/meteorjs3-vue3.html)
- Repository: [meteor/meteor3-vue3 (3.4-rspack)](https://github.com/meteor/meteor3-vue3/tree/3.4-rspack)
- Why: Step-by-step tutorial app for learning Meteor fundamentals with Vue 3
- Stack: Meteor, Rspack, Vue 3
- Meteor Version: 3.4

### Svelte Tutorial App
- Tutorial: [docs.meteor.com/tutorials/svelte](https://docs.meteor.com/tutorials/svelte/)
- Repository: [meteor/meteor3-svelte (3.4-rspack)](https://github.com/meteor/meteor3-svelte/tree/3.4-rspack)
- Why: Step-by-step tutorial app for learning Meteor fundamentals with Svelte
- Stack: Meteor, Rspack, Svelte 5
- Meteor Version: 3.4

### NFT Marketplace
- Repository: [meteor/examples/nft-marketplace](./nft-marketplace)
- Why: Decentralized NFT marketplace for minting, listing, and buying NFTs with wallet auth and on-chain transactions
- Stack: Meteor, Rspack, React, Tailwind CSS v4, Polygon, Solidity, Hardhat, Ethers.js, IPFS
- Last Updated At: Mar/14/2026
- Meteor Version: 3.4.1-rc.1

## How to add your example?

- Create a PR including it in this README
- Make sure you are using the latest Meteor (Meteor 3.x)
- Required fields: Repository, Why, Stack, Last Updated At and Meteor Version.

## Housekeeping

We want to list only up-to-date examples here.

If you see old examples that are no longer representing the current state of Meteor or that are not working please open a PR removing it from here.

## Join the Meteor Renaissance!

Meteor 3 starts a new era for building web applications, with multiplatform support, realtime features, modern JavaScript patterns, and a simple starting point. It gives you the flexibility of Node.js together with built-in tools and ready-to-use packages, so you can stay focused on the product.

We're excited about what's to come and can't wait for you to join the Meteor renaissance!

For feedback, questions, or support, visit our [forums](https://forums.meteor.com/) or join our [Discord channel](https://discord.com/invite/3w7EKdpghq).

Follow us on [Twitter](https://x.com/meteorjs) and [GitHub](https://github.com/meteor).
