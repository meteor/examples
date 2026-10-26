# Meteor 3.3 examples and checkout verification

`release-3.3-e2e` keeps the five examples with browser E2E suites on published Meteor 3.3.3. Use it to compare a 3.3 maintenance checkout with the published baseline. None of these five apps uses Rspack on this branch.

| App | Build | Browser suite | Adaptation |
| --- | --- | --- | --- |
| Parties | Meteor Isobuild | 8 Playwright tests | Restore the standard Meteor compiler and package versions; wait for a new map marker to be inserted and finish its animation before clicking. |
| Tic-Tac-Toe | Meteor Isobuild | 6 Playwright tests | Pin React Router 6.30.6, whose entry points resolve with the 3.3 tool. |
| Task Manager | Meteor Isobuild | 9 Playwright tests | Compile Meteor-RPC's TypeScript, use `/imports/` paths, and share one React 19 runtime through npm overrides. |
| Notes Offline | Meteor Isobuild | 14 Playwright tests | Use Babel for Lingui macros, compile catalogs and Workbox assets before startup, pin React Markdown 8.0.7 for 3.3 module resolution, and import the required icon modules directly. Includes an offline reload check. |
| Complex Todos (Svelte) | Meteor + Vite | 15 Cypress tests | Keep Svelte 5 and Skeleton UI through `meteor-vite`, using the integration available to Meteor 3.3. |

The original 51 test scenarios are retained. The added offline reload case brings the suite count to 52. Cypress retries are disabled, and Playwright runs with one worker and zero retries. No test timeout was increased to accommodate an application failure. Notes Offline waits for an enabled New Note button and a connected Meteor client instead of general network idleness; its scenario assertions remain intact.

## Verified comparison

On October 26, 2026, the same app source and npm lockfiles passed against published Meteor 3.3.3 and the 3.3.4 source checkout at [`b747ed4293627c0110d372c1a7e91552ea19e8b7`](https://github.com/meteor/meteor/commit/b747ed4293627c0110d372c1a7e91552ea19e8b7).

| App | Published 3.3.3 | 3.3.4 checkout |
| --- | --- | --- |
| Parties | 8/8 | 8/8 |
| Tic-Tac-Toe | 6/6 | 6/6 |
| Task Manager | 9/9 | 9/9 |
| Notes Offline | 14/14 | 14/14 |
| Complex Todos (Svelte) | 15/15 | 15/15 |
| **Total** | **52/52** | **52/52** |

These accepted runs had zero failures, skips or retries. They ran on Ubuntu 22.04 under WSL2, with Chromium 147.0.7727.15, Playwright 1.58.2 and Cypress 16.1.0. The published tool used Node 22.18.0; the checkout used Node 22.23.4 from dev bundle 22.23.4.0. Each run had a fresh app database, with at most two apps running concurrently and one browser worker per app.

The comparison followed fixes to the adaptation: incompatible module entry points, duplicate React runtimes, missing styles, Vite startup wiring and offline catalog loading. Parties needed normal clicks after its marker entrance animation, plus a marker-count check so the locator cannot select an earlier party before insertion. The intended title is also asserted. Two setup attempts found unfinished process cleanup in the local runner. Those failed attempts are separate from the accepted counts above. This is a newly adapted branch, not evidence of historical Meteor 3.3 examples CI.

The baseline selected the published 3.3.3 core package versions. The checkout selected the intended maintenance packages, and the built server files contained the DDP and Mongo field-preservation corrections. Separate Meteor release CI and publication preflight remain required.

## Published baseline

Install Meteor and Node 22, then run each app from its directory. Keep the repository layout because `npm start` uses the shared helper under `scripts/`.

```bash
cd parties
meteor --release 3.3.3 --version
meteor npm ci
npx playwright install chromium
METEOR_RELEASE=3.3.3 npm run e2e:headless -- --workers=1 --retries=0
```

Repeat for `tic-tac-toe`, `task-manager`, and `notes-offline`. Playwright starts and stops the app through `npm start`.

For Svelte, start the app in one terminal and run Cypress from another:

```bash
cd complex-todos-svelte
meteor npm ci
METEOR_RELEASE=3.3.3 npm start
# In a second terminal, from complex-todos-svelte:
npm run e2e:headless -- --browser chrome --config retries=0
```

## Source checkout

Use the absolute path to the intended Meteor source checkout. Leave `METEOR_RELEASE` unset; the source checkout selects its own packages and dev bundle.

```bash
cd parties
env -u METEOR_RELEASE METEOR_BIN=/absolute/path/to/meteor/meteor npm run e2e:headless -- --workers=1 --retries=0
```

For Svelte, set `METEOR_BIN` on the `npm start` command and run Cypress separately as above. Start with a fresh app copy or database for each baseline/candidate comparison, using the same source and lockfiles. Keep `.meteor/release` at 3.3.3; do not set it to an unpublished maintenance version.

`PORT` selects the Meteor port. Set `TEST_BASE_URL` to the same URL when changing it. Vite serves Svelte assets through Meteor's `/vite/` route. `TEST_EXTERNAL_SERVER=1` tells Playwright to use an app that is already running. `CHROMIUM_EXECUTABLE_PATH` optionally selects an installed Chromium for Playwright.

Notes Offline generates catalogs and `public/sw.js` through `npm run prepare:assets`, which runs before `npm start`. Run that command explicitly before a direct `meteor build` or `meteor deploy`.

## CI

The **Meteor 3.3 examples** workflow runs all five apps on pushes to this branch. Its manual `meteor_ref` input accepts a `meteor/meteor` source ref for checkout verification; an empty input uses published 3.3.3. The workflow keeps browser reports and failure artifacts.

## Verification scope

Application E2E results cover development-mode browser behavior on the tested source and package selections. They do not replace Meteor's own release CI, security regression tests, production-build verification, native testing, or a post-publication upgrade check. The live demos are separate deployments and do not prove this branch's results.
