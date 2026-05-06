# Parties

A collaborative event planning app where users create parties, place them on an interactive map, and RSVP. One of the original Meteor examples, now running on Meteor 3.5-beta.10 with Blaze 3 and async database operations.

Demo: https://parties.sandbox.galaxycloud.app/

## Stack

| | |
|---|---|
| Runtime | Meteor 3.5-beta.10 |
| Frontend | Blaze 3 |
| UI | Bootstrap 5 |
| Visualization | D3.js v7 (interactive map) |
| Database | MongoDB |
| Auth | Meteor Accounts (password) |
| Code Quality | RSLint |
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
| `npm run lint` | Lint (RSLint) |
| `npm run lint:fix` | Lint and auto-fix (RSLint) |
| `npm run e2e` | E2E tests (Playwright, interactive UI) |
| `npm run e2e:headless` | E2E tests (Playwright, headless) |

Before running E2E tests for the first time, install Playwright's browsers with `npx playwright install`.

## What it does

- Create public or private parties with a title, description, and map coordinates
- Parties appear as circles on a D3-rendered map, sized by attendance
- RSVP to parties with Yes, Maybe, or No
- Invite specific users to private parties (with email notifications)
- Real-time updates across all connected clients

## How it's structured

```
client/
  main.html             # Shell HTML
  main.js               # Entry: imports UI templates and styles
server/
  main.js               # Publications (parties, users directory)
imports/
  api/
    parties/
      collection.js     # Parties collection + Collection.allow rules
      methods.js        # createParty, invite, rsvp
      publications.js   # Party publications
      helpers.js        # Reactive helpers shared by UI and methods
  ui/
    page.js             # Top-level Blaze layout
    map.js              # D3-rendered party map
    details.js          # Party detail panel
    attendance.js       # RSVP controls and counts
    createDialog.js     # New party dialog
    inviteDialog.js     # Invite-user dialog
```

The data model uses `Collection.allow()` for client-side security rules (owner-only updates, no cowboy inserts) and Meteor methods for operations that need server-side validation (creating parties, inviting users, RSVPs).

## Deployment

- **[Galaxy](https://galaxycloud.app/)**: `meteor deploy your-app.meteorapp.com`
  - To try it quickly with a free tier and shared MongoDB: `meteor deploy your-app.meteorapp.com --free --mongo`
- **Any Node.js host**: `meteor build` gives you a standard Node bundle
- **MUP**: automated deploy to your own server over SSH

## Links

- [Meteor docs](https://docs.meteor.com/) · [Meteor guide](https://guide.meteor.com/)
- [Blaze docs](https://www.blazejs.org/)
- [D3.js](https://d3js.org/) · [Bootstrap](https://getbootstrap.com/)
