# Meteor Escape

Meteor Escape is a mobile-first cooperative microgame built with Meteor, React,
Konsta UI, Rspack, and Capacitor. It starts with a solo captain and a CPU
copilot, then lets a second human replace the CPU through a shared room code.
Native haptics, sharing, runtime metadata, DDP controls, and Hot Code Push
diagnostics stay on a dedicated System information screen so the mission view
stays focused on play.

## Rules

Every turn presents one emergency:

- `Meteor` -> answer with `Shield`
- `Path` -> answer with `Boost`
- `Overheat` -> answer with `Cool`

Correct answers add 20 warp and extend the streak. Wrong or late answers remove
25 shield and reset the streak. Reach 100 warp before the 60 second mission
clock or before shield hits zero. Solo missions always start with the human on
`Meteor`, then alternate with the CPU through the production turn order. Crew
missions keep the same rules, but a second human replaces the CPU after joining
the room code.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.4.1 from the local checkout while the Capacitor package is unpublished |
| Frontend | React 19 (`react-meteor-data` for reactive game state) |
| UI | Konsta UI with a compact mobile shell and bottom tab navigation |
| Database | MongoDB |
| Native shell | Capacitor 7 through the Meteor `capacitor` package |
| Native plugins | `@capacitor/app`, `@capacitor/haptics`, `@capacitor/network`, `@capacitor/share` |
| HCP | Meteor Capacitor webapp Hot Code Push via `window.WebAppLocalServer` |
| Tests | Mocha, oxlint, Playwright, Maestro smoke flow |
| Build | Rspack |

## Running It

The Meteor release that contains the `capacitor` package is not published yet.
Until it is, run the app with the local Meteor checkout and link the local npm
packages that live next to that checkout.

```bash
PATH=/Users/igcogi/meteor/meteor:$PATH meteor npm install
npm link --no-save ../../meteor/npm-packages/meteor-capacitor ../../meteor/npm-packages/meteor-rspack
PATH=/Users/igcogi/meteor/meteor:$PATH npm start
```

Visit `http://localhost:3000/`.

After the package is published, the checkout prefix and local npm links can be
removed. At that point the app should use the published Meteor release and the
published `@meteorjs/capacitor` package instead of the file-linked checkout
package.

| Command | What it does |
|---|---|
| `npm start` | Start the Meteor app |
| `npm test` | Run Mocha integration tests in watch mode |
| `npm run test:headless` | Run Mocha integration tests once for CI |
| `npm run lint` | Run oxlint |
| `npm run lint:fix` | Run oxlint with autofix |
| `npm run e2e` | Run Playwright with the interactive UI |
| `npm run e2e:headless` | Run Playwright headlessly |

Before running Playwright locally for the first time, install the browser
binaries with `npx playwright install`.

## Native Setup

Capacitor projects are generated from the Meteor app. The generated `android/`
and `ios/` folders are intentionally not the main source of truth for this
example; keep app behavior in the Meteor source and document any native
permission changes that must be re-applied after `meteor add-platform`.

```bash
PATH=/Users/igcogi/meteor/meteor:$PATH meteor add-platform android
PATH=/Users/igcogi/meteor/meteor:$PATH meteor run android

PATH=/Users/igcogi/meteor/meteor:$PATH meteor add-platform ios
PATH=/Users/igcogi/meteor/meteor:$PATH meteor run ios
```

Native integrations used by this example:

- `@capacitor/app` for application metadata and native back handling
- `@capacitor/haptics` for success feedback after mission actions
- `@capacitor/network` for online/offline mission control state
- `@capacitor/share` for mission summary sharing from the result sheet

## Crew Room Behavior

Crew rooms use a six-character code drawn from `A-H`, `J-N`, `P-Z`, and `2-9`.
Creating a crew mission keeps that room active until another human joins or the
captain starts over. The captain can hide the waiting sheet, reopen the same
room from the home screen, and share the code through the native share sheet
when available.

## Hot Code Push

`package.json` opts into Meteor Capacitor webapp HCP with:

```json
"meteor": {
  "capacitor": {
    "hcp": "webapp"
  }
}
```

The UI uses `imports/ui/native/hcp.js` as a small bridge around the native
`window.WebAppLocalServer` API. `listenForHcpUpdates` subscribes to
`onNewVersionReady`, `checkForHcpUpdates` calls `checkForUpdates`, and
`applyHcpUpdate` calls `switchToPendingVersion`. System information shows update
state and controls; its dialog appears when the native bridge reports a ready
web bundle.

The "Preview HCP update" action is a deterministic demo and test path. It does
not pretend that a server update was downloaded; it simply opens the same dialog
that native HCP opens so Playwright and Maestro can assert the user-facing
update experience without requiring a second deployment.

## How It Is Structured

```text
imports/
  api/games/
    collection.js    # Mongo.Collection and game status constants
    engine.js        # Mission rules and turn resolution
    methods.js       # Start, join, answer, and rematch methods
    publications.js  # Active and recent game subscriptions
    schema.js        # Zod validation
    server/cpu.js    # CPU scheduling for solo missions
  ui/
    App.jsx          # Main state and native service orchestration
    pages/           # Home, records, and System information screens
    components/      # Mission shell, sheets, meters, HCP dialog, controls
    native/          # Capacitor plugin wrappers and browser fallbacks
    identity.js      # Per-device ownerId and playerId helper
client/
  main.jsx           # Konsta theme and React entry point
  main.css           # Responsive layout and mission styling
server/
  main.js            # Imports game API
tests/
  *.test.js          # Meteor method and native helper tests
e2e/
  game.spec.js       # Playwright web flows
```

## Testing

Run the app-level checks from this directory:

```bash
PATH=/Users/igcogi/meteor/meteor:$PATH npm run lint
PATH=/Users/igcogi/meteor/meteor:$PATH npm run test:headless
PATH=/Users/igcogi/meteor/meteor:$PATH CI=1 npm run e2e:headless
```

From the repository root, shared checks cover the mobile example set and native
runner utilities:

```bash
npm run test:native:unit
node scripts/test-mobile-examples.mjs
npm run test:native:meteor-escape:android
npm run test:native:meteor-escape:ios
```

Native smoke flows live in `../native-tests`. Start the native app first, then
run the matching Maestro command from the repository root. The flow plays the
production quick mission order `Shield -> CPU -> Boost -> CPU -> Cool`, then
checks System information runtime, DDP, native mode, HCP preview, and native
back behavior.

## Troubleshooting

- If `meteor run` does not find the `capacitor` package, confirm that
  `/Users/igcogi/meteor/meteor` is first on `PATH`.
- If npm cannot resolve `@meteorjs/capacitor`, rerun the local `npm link` command
  after `meteor npm install`.
- If Playwright opens the wrong app on port 3000, stop any stale Meteor or native
  test process with `lsof -nP -iTCP:3000 -sTCP:LISTEN`.
- If the crew room seems stale, tap `Create Crew Mission` again to start a fresh
  waiting room with a new code.
- If iOS launches the wrong simulator, set `METEOR_CAPACITOR_TARGET=<UDID>` before
  `meteor run ios`.

## Links

- [Meteor docs](https://docs.meteor.com/)
- [Capacitor docs](https://capacitorjs.com/docs)
- [Konsta UI](https://konstaui.com/)
