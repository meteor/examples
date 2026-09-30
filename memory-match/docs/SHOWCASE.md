# Memory Match showcase walkthrough

Run setup from the [README](../README.md) before presenting. Keep the Meteor
checkout on `rspack-rstest-integration`; the launcher validates it every time.
Run commands from `memory-match`. The full-app tests start and stop their own
Meteor app and MongoDB, so the normal game does not need to be running.

## Preflight

```bash
npm run test:tooling
npm run typecheck
npm run test:unit
npm run test:component
npm run test:browser
npm run test:integration
npm run test:package
npm run test:e2e
```

Run these sequentially; some Meteor commands share default ports. Complete the
first build and browser installation before presenting.

## A five-minute demo

1. **Play the app.** Run `npm start`, enter a player name, and flip a few cards.
   Matching pairs stay face up; mismatches turn back after a short pause. Open
   another browser window on the starting screen. Complete a game to show the
   shared leaderboard updating without a refresh. Use **New game** to restart.
   Stop the development server before running the test demo.
2. **Start with fast feedback.** Run `npm run test:unit`. Open
   `imports/game/rules.test.ts` and `imports/game/shuffle.ts`: the same game
   logic has table-driven tests, snapshots, mocks, and an in-source test.
3. **Show a real browser.** Run `SHOWCASE_HEADED=1 npm run test:browser`.
   `imports/ui/MemoryGame.interactions.test.tsx` exercises cards and keyboard
   focus in Chromium. Compare its `@rstest/browser` import with the
   jsdom example in `imports/ui/MemoryGame.dom.rstest.test.tsx`.
4. **Test the real Meteor runtime.** Run `npm run test:integration`. Open
   `imports/api/methods.server.meteor.rstest.test.ts` and
   `imports/api/subscription.client.meteor.rstest.test.ts`: these use real
   methods, MongoDB, DDP, Minimongo, and Tracker.
5. **Finish with the full application.** Run
   `SHOWCASE_HEADED=1 npm run test:e2e`. It completes a deterministic game and
   verifies the score arrives in a second browser context. The seed is accepted
   only in Meteor test mode; normal play remains random.

## Deeper examples

| What to show | Command | Source to open |
| --- | --- | --- |
| Local Atmosphere package | `npm run test:package` | `packages/memory-match-engine/package.js` and `engine.tests.ts` |
| Watch feedback | `npm run test:watch` | `imports/game/score.test.ts` |
| Native file workers | `npm run test:parallel:native` | `imports/game/concurrency.test.ts` |
| Isolated Meteor processes | `npm run test:parallel:meteor` | `imports/api/mongo-isolation.server.meteor.rstest.test.ts` |
| Combined Istanbul report | `npm run test:coverage` | `coverage/index.html` after the run |

In watch mode, change an assertion, show the failure, restore it, then stop with
Ctrl+C. Coverage includes the game, UI, and local package across selected native,
Meteor, and full-app E2E tests. Configuration is in `rstest.config.ts`.
