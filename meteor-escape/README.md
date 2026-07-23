# Meteor Escape

Meteor Escape is a mobile-first cooperative microgame built with Meteor, React,
Konsta UI, Rspack, and Capacitor. It starts with a solo captain and a CPU
copilot, then lets a second human replace the CPU through a shared room code.
Native haptics, sharing, runtime metadata, DDP controls, and Hot Code Push
diagnostics stay on a dedicated System information screen so the mission view
stays focused on play.

## Gallery

Deterministic Playwright captures cover 390x844 phones, 768x1024 tablets, and a
1440x1000 desktop preview. Gallery output is kept outside the checkout alongside
the native Maestro videos so it can be reused in posts and pull requests.

```bash
export NATIVE_SHOWCASE_OUTPUT_DIR=/absolute/path/to/native-app-showcase
PATH=/Users/igcogi/meteor/meteor:$PATH npm run e2e:gallery
```

Captures are written to
`$NATIVE_SHOWCASE_OUTPUT_DIR/meteor-escape/screenshots/gallery/`.

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
Until it is, launch the native app from the examples repository root. The shared
runner verifies the local `capacitor-integration` checkout, installs dependencies,
links local Meteor npm packages, ensures the platform exists, and starts the full
native target.

```bash
npm run run:native:meteor-escape -- ios
npm run run:native:meteor-escape -- android
```

Meteor options go after a second separator. Native environment variables pass
through unchanged:

```bash
npm run run:native:meteor-escape -- ios -- --port 3100
METEOR_CAPACITOR_MODE=livereload npm run run:native:meteor-escape -- android --development -- --mobile-server 10.0.2.2:3000
METEOR_CAPACITOR_TARGET="DEVICE_ID" npm run run:native:meteor-escape -- ios
```

Bundled runs use production bundling by default so Rspack emits complete HCP
assets. `--development` is intended for livereload sessions attached to the
development server.

Run `npm run run:native -- --help` for checkout overrides, setup skip options,
and dry-run mode. For a browser preview, run
`PATH=/Users/igcogi/meteor/meteor:$PATH npm start` in this directory, then visit
`http://localhost:3000/`.

After the package is published, the checkout prefix and local npm links can be
removed. At that point the app should use the published Meteor release and the
published `@meteorjs/capacitor` package instead of the file-linked checkout
package.

| Command | What it does |
|---|---|
| `npm run run:native:meteor-escape -- <ios\|android>` (repository root) | Prepare and launch the full native target |
| `npm start` | Start the Meteor app |
| `npm test` | Run Mocha integration tests in watch mode |
| `npm run test:headless` | Run Mocha integration tests once for CI |
| `npm run lint` | Run oxlint |
| `npm run lint:fix` | Run oxlint with autofix |
| `npm run e2e` | Run Playwright with the interactive UI |
| `npm run e2e:headless` | Run Playwright headlessly |
| `npm run e2e:gallery` | Capture the external promotion gallery |

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
Creating a crew mission keeps that room active until another human joins. The
captain can hide the waiting sheet, reopen the same room from the home screen,
and share the code through the native share sheet when available. Repeated
create requests return the existing waiting room instead of minting extra codes.

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
`applyHcpUpdate` calls `switchToPendingVersion`. System information keeps manual
checks and update diagnostics. When the native bridge reports a ready web bundle,
an app-level Konsta-styled sheet opens over Play, Records, System, or an active
mission. Choosing "Not now" leaves a persistent "Update ready" reminder above
the tab bar.

The client installs a Meteor reload migration gate before the application
mounts. Downloading a bundle does not switch versions or refresh the WebView;
the current mission build keeps running until the user chooses "Install update".

The "Preview HCP update" action is a deterministic demo and test path. It does
not pretend that a server update was downloaded; it opens the same global sheet
and reminder flow that native HCP uses so Playwright and Maestro can assert the
user-facing update experience without requiring a second deployment.

## How It Is Structured

```text
imports/
  api/games/
    collection.js    # Mongo.Collection and game status constants
    engine.js        # Mission rules and turn resolution
    methods.js       # Start, join, answer, and rematch methods
    publications.js  # Active and recent game subscriptions
    schema.js        # Zod validation
    server/cpu.js    # Turn deadlines and CPU actions for solo missions
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
npm run record:native:meteor-escape:android
npm run record:native:meteor-escape:ios
```

Native smoke flows live in `../native-tests`. Start the native app first, then
run the matching Maestro command from the repository root. The flow plays the
production quick mission order `Shield -> CPU -> Boost -> CPU -> Cool`, then
checks System information runtime, DDP, native mode, HCP preview, and native
back behavior. Showcase recording uses a separate product-only journey and
requires `NATIVE_SHOWCASE_OUTPUT_DIR` outside this checkout.

## Troubleshooting

- If `meteor run` does not find the `capacitor` package, confirm that
  `/Users/igcogi/meteor/meteor` is first on `PATH`.
- If npm cannot resolve `@meteorjs/capacitor`, rerun the local `npm link` command
  after `meteor npm install`.
- If Playwright opens the wrong app on port 3000, stop any stale Meteor or native
  test process with `lsof -nP -iTCP:3000 -sTCP:LISTEN`.
- If the crew room seems stale, tap `Create Crew Mission` to reopen the same
  waiting room and share its code again.
- If iOS launches the wrong simulator, set `METEOR_CAPACITOR_TARGET=<UDID>` before
  `meteor run ios`.

## Links

- [Meteor docs](https://docs.meteor.com/)
- [Capacitor docs](https://capacitorjs.com/docs)
- [Konsta UI](https://konstaui.com/)
