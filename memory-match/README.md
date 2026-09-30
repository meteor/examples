# Memory Match

A real-time Memory Match game built with Meteor, React, and TypeScript. Find
eight cosmic pairs, then watch completed scores appear immediately in the shared
leaderboard. The app also demonstrates Rstest across pure game logic, React
components, real Meteor methods and publications, a local Atmosphere package,
and full-browser E2E tests.

![A completed Memory Match board with the live leaderboard](docs/preview.png)

> **Prerelease setup:** Rstest support is not yet in an official Meteor release.
> Until it is, this example uses a Meteor source checkout on the
> [`rspack-rstest-integration`](https://github.com/meteor/meteor/tree/rspack-rstest-integration)
> branch. `meteor-checkout` is a temporary launcher created by setup; it will be
> removed when the integration is published. After setup, commands do not need
> `METEOR_CHECKOUT` to remain exported.

## Stack

| | |
|---|---|
| Runtime | Meteor prerelease with Rstest integration |
| Frontend | React 19 + TypeScript |
| Database | MongoDB |
| Data | Meteor methods, publications, DDP, Minimongo, and Tracker |
| Tests | Rstest, Testing Library, and Playwright |
| Build | Rspack |

## Features

- Play a sixteen-card memory game with accessible, keyboard-friendly controls
- Reactively share completed scores through Meteor pub/sub
- Test game logic in Node, UI in jsdom and Chromium, and app behavior in a real Meteor runtime
- Run a local Atmosphere package and end-to-end browser tests through the same test runner
- Generate Istanbul coverage across app, package, and E2E test sources

## Running it

Use Node.js 22.12 or newer. No global Meteor installation is needed. Run setup
before `npm install` or `npm ci`. The temporary setup expects sibling Meteor and
examples checkouts:

```text
workspace/
├── meteor/                 # rspack-rstest-integration
└── examples/
    └── memory-match/
```

From the directory containing `examples`, clone the required Meteor checkout:

```bash
git clone --branch rspack-rstest-integration https://github.com/meteor/meteor.git meteor
cd examples/memory-match
npm run setup
./meteor-checkout npx playwright install chromium
npm start
```

Visit `http://localhost:3000/`. Open a second browser tab before completing a
game to see its leaderboard entry arrive without a page refresh.

If the checkout is elsewhere, set `METEOR_CHECKOUT` during setup:

```bash
METEOR_CHECKOUT=/absolute/path/to/meteor npm run setup
```

The setup script validates the required branch, links the checkout's unpublished
packages into this app, installs dependencies, generates Meteor declarations,
and creates `meteor-checkout`. On Linux, use
`./meteor-checkout npx playwright install --with-deps chromium` to install
Chromium system dependencies. Rerun setup after changing the checkout branch or
reinstalling dependencies.

## Test suite

| Command | What it does |
|---|---|
| `npm test` | Native game tests in Node |
| `npm run test:watch` | Watch the native game tests |
| `npm run test:component` | React component tests in jsdom |
| `npm run test:browser` | Browser Mode tests in Chromium |
| `npm run test:integration` | Real Meteor server and client tests |
| `npm run test:package` | Local Atmosphere package tests |
| `npm run test:e2e` | Full app E2E tests with Playwright |
| `npm run test:coverage` | Combined Istanbul coverage report |
| `npm run test:parallel:native` | Native Rstest workers |
| `npm run test:parallel:meteor` | Isolated Meteor runtime workers |
| `npm run typecheck` | TypeScript checks |
| `npm run test:tooling` | Temporary checkout setup and launcher checks |

Run `./meteor-checkout npx playwright install chromium` once before Browser Mode
or E2E tests. Full-app test commands manage their own Meteor app and MongoDB, so
you do not need to start the game first.

## How it is structured

```text
imports/
  api/             # Collection, methods, and publications
  game/            # Game rules, scoring, deterministic shuffle, and unit tests
  ui/              # React game and leaderboard components with UI tests
packages/
  memory-match-engine/  # Local Atmosphere package and its Rstest tests
tests/
  e2e/             # Playwright against the complete Meteor application
  tooling/         # Checkout and routing checks
rstest.config.ts   # Browser, coverage, and test project configuration
```

The ordinary test sources use `@rstest/core`. Tests that import `meteor/*` run
inside real Meteor hosts; pure tests use Rstest's Node, jsdom, or browser
projects. See [Rstest integration details](docs/RSTEST.md) for the routing rules,
coverage behavior, parallel execution, and the publication checklist.

For a narrated demo, use the [showcase walkthrough](docs/SHOWCASE.md).

## Links

- [Meteor docs](https://docs.meteor.com/) · [Meteor guide](https://guide.meteor.com/)
- [React docs](https://react.dev/)
- [Rstest](https://rstest.rs/) · [Testing Library](https://testing-library.com/) · [Playwright](https://playwright.dev/)
