# Tic-Tac-Toe

Multiplayer tic-tac-toe with room support, built with Meteor, React, and Material UI. Shows how Meteor's real-time pub/sub works for game state synchronization between two players.

Demo: https://tic-tac-toe.sandbox.galaxycloud.app/

## Stack

| | |
|---|---|
| Runtime | Meteor 3.4.1-rc.1 |
| Frontend | React 19 (`react-meteor-data` for `useTracker` / `useFind`) |
| UI | MUI v7 (Material UI) |
| Routing | React Router v7 |
| Database | MongoDB |
| Tests | Mocha (via `meteortesting:mocha`) |
| Code Quality | oxlint (OXC) + react, import plugins |
| E2E | Playwright |
| Build | Rspack |

## Running it

```bash
meteor npm install
npm start
```

Visit `http://localhost:3000/`.

| Command | What it does |
|---|---|
| `npm start` | Start the app |
| `npm test` | Integration tests (Mocha, watch mode) |
| `npm run test:headless` | Integration tests (Mocha, headless/CI) |
| `npm run visualize` | Bundle analyzer in production mode |
| `npm run lint` | Lint (oxlint) |
| `npm run lint:fix` | Lint and auto-fix (oxlint) |
| `npm run e2e` | E2E tests (Playwright, interactive UI) |
| `npm run e2e:headless` | E2E tests (Playwright, headless) |

Before running E2E tests for the first time, install Playwright's browsers with `npx playwright install`.

## How to play

This is a two-player game. Open the app in **two separate browser tabs**:

1. In the first tab, click **Create Room**
2. Click **Join Room** from both tabs on the same room
3. Players alternate turns: one plays as X, the other as O
4. The game announces the winner via a dialog when three in a row is achieved

## Deployment

- **[Galaxy](https://galaxycloud.app/)**: `meteor deploy your-app.meteorapp.com`
  - To try it quickly with a free tier and shared MongoDB: `meteor deploy your-app.meteorapp.com --free --mongo`
- **Any Node.js host**: `meteor build` gives you a standard Node bundle
- **MUP**: automated deploy to your own server over SSH

## Links

- [Meteor docs](https://docs.meteor.com/) · [Meteor guide](https://guide.meteor.com/)
- [React docs](https://react.dev/)
- [MUI](https://mui.com/) · [React Router](https://reactrouter.com/)
