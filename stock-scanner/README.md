# Stock Scanner

Stock Scanner is a mobile-first inventory audit example built with Meteor, React,
MUI, Rspack, and Capacitor. It models a lightweight stock-counting workflow for a
store room or pop-up retail team: scan or enter an item code, adjust the counted
quantity, keep an audit history in MongoDB, and share a concise count summary
through the native share sheet.

This example is intentionally smaller than the richer Civic Snap app. It opens
on a populated morning shift with a stockroom brief, category-aware product
states, and low-stock work ready to review. Browser tests inject isolated owners;
normal first launch uses the stable demo owner so the showcase never opens as an
empty technical shell.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.4.1 from the local checkout while the Capacitor package is unpublished |
| Frontend | React 19 (`react-meteor-data` for reactive inventory reads) |
| UI | MUI v7 with a compact mobile theme and responsive bottom sheet |
| Database | MongoDB |
| Native shell | Capacitor 7 through the Meteor `capacitor` package |
| Native plugins | `@capacitor/app`, `@capacitor/barcode-scanner`, `@capacitor/haptics`, `@capacitor/share` |
| HCP | Meteor Capacitor webapp Hot Code Push via `window.WebAppLocalServer` |
| Tests | Mocha, oxlint, Playwright, Maestro smoke flow |
| Build | Rspack |

## Features

- Adaptive MUI app bar and drawer navigation: temporary on phones and narrow
  tablets, with a persistent rail on wide tablets and desktop previews.
- Illustrated shift brief with progress, stock totals, and visible low-stock work.
- Camera-first scan action, secondary manual entry, and category-aware inventory rows.
- Barcode scan action that uses `@capacitor/barcode-scanner` on native and a
  deterministic fallback code on the web.
- Quantity adjustment and audit methods backed by Meteor methods and MongoDB.
- Native haptic feedback after successful scan/save actions.
- Native share sheet for the current stock audit summary, with browser fallback.
- Dedicated System information screen for app version/build, Capacitor runtime,
  Meteor release, DDP endpoint and controls, and Hot Code Push actions.
- Real native HCP listener plus deterministic preview path for web and Maestro.

The drawer separates the floor workflow from **System information**. Version,
build, runtime, DDP, HCP, and diagnostic controls are intentionally absent from
the inventory screen.

## Running It

The Meteor release that contains the `capacitor` package is not published yet.
Until it is, launch the native app from the examples repository root. The shared
runner verifies the local `capacitor-integration` checkout, installs dependencies,
links local Meteor npm packages, ensures the platform exists, and starts the full
native target.

```bash
npm run run:native:stock-scanner -- ios
npm run run:native:stock-scanner -- android
```

Meteor options go after a second separator. Native environment variables pass
through unchanged:

```bash
npm run run:native:stock-scanner -- ios -- --port 3100
METEOR_CAPACITOR_MODE=livereload npm run run:native:stock-scanner -- android -- --mobile-server 10.0.2.2:3000
METEOR_CAPACITOR_TARGET="DEVICE_ID" npm run run:native:stock-scanner -- ios
```

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
| `npm run run:native:stock-scanner -- <ios\|android>` (repository root) | Prepare and launch the full native target |
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
example; keep app behavior in the Meteor source and document native permission
changes that must be applied after `meteor add-platform`.

```bash
PATH=/Users/igcogi/meteor/meteor:$PATH meteor add-platform android
PATH=/Users/igcogi/meteor/meteor:$PATH meteor run android

PATH=/Users/igcogi/meteor/meteor:$PATH meteor add-platform ios
PATH=/Users/igcogi/meteor/meteor:$PATH meteor run ios
```

The Barcode Scanner plugin requires Android `minSdkVersion = 26` and camera
permission. The shared native launcher applies both after platform generation.
When using direct Meteor commands instead, set `minSdkVersion = 26` in
`android/variables.gradle` and add `android.permission.CAMERA` to the generated
manifest.

The launcher also adds `NSCameraUsageDescription` to `ios/App/App/Info.plist`.
Add it manually after `meteor add-platform ios` only when bypassing the launcher.
The scanner asks for camera access after the user taps the scan action.

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
state and controls; its dialog appears when the native bridge reports a ready web
bundle.

The "Preview dialog" button is a deterministic demo and test path. It does not
pretend that a server update was downloaded; it simply opens the same dialog that
native HCP opens so Playwright and Maestro can assert the user-facing update
experience without requiring a second deployment.

## How It Is Structured

```text
imports/
  api/inventory/
    collection.js    # Mongo.Collection
    fixtures.js      # Initial products
    methods.js       # Scan, quantity, and audit methods
    publications.js  # Owner-scoped publication
    schema.js        # Zod validation
  ui/
    App.jsx          # Main state and native service orchestration
    pages/           # Inventory and System information screens
    components/      # Adaptive shell, inventory tools, sheets, HCP panel
    native/          # Capacitor plugin wrappers, cleanup, and browser fallbacks
    owner.js         # Stable showcase owner helper
    theme.js         # Shared MUI theme
client/
  main.jsx           # Theme and React entry point
  main.css           # App-level responsive styling
server/
  main.js            # Imports inventory API
tests/
  *.test.js          # Meteor method tests
e2e/
  stock.spec.js      # Playwright web flows
```

## Testing

Run the app-level checks from this directory:

```bash
PATH=/Users/igcogi/meteor/meteor:$PATH npm run lint
PATH=/Users/igcogi/meteor/meteor:$PATH npm run test:headless
PATH=/Users/igcogi/meteor/meteor:$PATH CI=1 npm run e2e:headless
```

From the repository root, `npm run test:mobile-examples` runs the same lint,
Meteor tests, and Playwright checks for both mobile examples with the checkout
Meteor binary and local npm links.

Native smoke flows live in `../native-tests`. Start the native app first, then
run the matching Maestro command from the repository root:

```bash
npm run test:native:stock-scanner:android
npm run test:native:stock-scanner:ios
npm run record:native:stock-scanner:android
npm run record:native:stock-scanner:ios
```

The native flow avoids camera permission prompts. It opens the adaptive drawer,
checks DDP and Capacitor details on System information, covers the HCP preview,
then returns to Inventory for the manual SKU workflow. The separate recording
flow stays on the floor-counting experience and writes video, poster, and run
evidence to the external `NATIVE_SHOWCASE_OUTPUT_DIR` library.

## Troubleshooting

- If `meteor run` does not find the `capacitor` package, confirm that
  `/Users/igcogi/meteor/meteor` is first on `PATH`.
- If npm cannot resolve `@meteorjs/capacitor`, rerun the local `npm link` command
  after `meteor npm install`.
- If Playwright opens the wrong app on port 3000, stop any stale Meteor or native
  test process with `lsof -nP -iTCP:3000 -sTCP:LISTEN`.
- If Android barcode scanning fails at build time, recheck `minSdkVersion = 26`.
- If iOS launches the wrong simulator, set `METEOR_CAPACITOR_TARGET=<UDID>` before
  `meteor run ios`.

## Links

- [Meteor docs](https://docs.meteor.com/)
- [Capacitor docs](https://capacitorjs.com/docs)
- [MUI](https://mui.com/)
- [Capacitor Barcode Scanner](https://capacitorjs.com/docs/apis/barcode-scanner)
- [Capacitor Share](https://capacitorjs.com/docs/apis/share)
