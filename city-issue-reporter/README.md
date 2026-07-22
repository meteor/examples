# Civic Snap

Civic Snap is a richer mobile-first example for reporting city issues from a
phone. It is built with Meteor, React, Framework7, Rspack, offline-capable Meteor
data, and Capacitor. The workflow is deliberately practical: compose a report,
attach a photo, stamp the current location, submit it, schedule a follow-up
reminder, and share a report summary.

This app complements Stock Scanner. It opens on a populated Centro field brief
with submitted, review, fixed, and draft examples, so the reporting lifecycle is
visible immediately. Browser tests inject isolated owners; normal first launch
uses the stable demo owner.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.4.1 from the local checkout while the Capacitor package is unpublished |
| Frontend | React 19 (`react-meteor-data` for report reads) |
| UI | Framework7 React v9 |
| Database | MongoDB |
| Offline data | `jam:offline`, `jam:method`, `jam:pub-sub` |
| Native shell | Capacitor 7 through the Meteor `capacitor` package |
| Native plugins | `@capacitor/app`, `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/network`, `@capacitor/local-notifications`, `@capacitor/share` |
| HCP | Meteor Capacitor webapp Hot Code Push via `window.WebAppLocalServer` |
| Tests | Mocha, oxlint, Playwright, Maestro smoke flow |
| Build | Rspack |

## Features

- Framework7 navbar and swipe panel navigation, persistent on wide tablets and
  desktop previews.
- Illustrated neighborhood field brief with network state and report counts.
- Category-aware report queue with evidence previews and lifecycle progress.
- Guided issue/evidence report form with category, title, description, photo,
  and current location capture.
- Offline-capable report submission using `jam:offline`, `jam:method`, and
  `jam:pub-sub`; the Network plugin is only a status signal, not the storage
  layer.
- Detail screen with evidence, location, status timeline, follow-up scheduling,
  and native share support.
- Browser fallbacks for camera, geolocation, notification, and share behavior so
  the same app remains useful in Playwright and desktop development.
- Dedicated System information screen for version/build, runtime, DDP endpoint
  and controls, and HCP state/actions.
- Framework7 update sheet wired to Meteor Capacitor HCP, with deterministic test preview.

The panel separates Reports and New report from **System information**. Version,
build, runtime, DDP, HCP, and diagnostic controls stay off the community screens.

## Running It

The Meteor release that contains the `capacitor` package is not published yet.
Until it is, launch the native app from the examples repository root. The shared
runner verifies the local `capacitor-integration` checkout, installs dependencies,
links local Meteor npm packages, ensures the platform exists, and starts the full
native target.

```bash
npm run run:native:civic-snap -- ios
npm run run:native:civic-snap -- android
```

Meteor options go after a second separator. Native environment variables pass
through unchanged:

```bash
npm run run:native:civic-snap -- ios -- --port 3100
METEOR_CAPACITOR_MODE=livereload npm run run:native:civic-snap -- android -- --mobile-server 10.0.2.2:3000
METEOR_CAPACITOR_TARGET="DEVICE_ID" npm run run:native:civic-snap -- ios
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
| `npm run run:native:civic-snap -- <ios\|android>` (repository root) | Prepare and launch the full native target |
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

Permissions are requested only after explicit user actions. The native smoke
flow avoids actions that would require camera, geolocation, notification, or
share prompts.

The shared native launcher adds required usage strings to
`ios/App/App/Info.plist`:

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSLocationWhenInUseUsageDescription`

It also adds required location permissions to
`android/app/src/main/AndroidManifest.xml`:

- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.ACCESS_FINE_LOCATION`

Add `android.permission.SCHEDULE_EXACT_ALARM` only if the app is changed to
schedule exact alarms for follow-up reminders.

Apply these entries manually after `meteor add-platform` only when bypassing the
shared launcher.

## Offline Behavior

Civic Snap uses the `jam:*` package family for offline-capable data flow:

- `jam:offline` persists local data and method queues in IndexedDB.
- `jam:method` gives report mutations optimistic behavior and queues work while
  the device is offline.
- `jam:pub-sub` keeps the owner-scoped report subscription available from cache.

The Network plugin is intentionally kept as a UI signal. It lets the app show
whether the device appears connected, but it does not own persistence or sync.
That separation keeps the native plugin wrapper small and leaves Meteor data
flow responsible for offline behavior.

## Hot Code Push

`package.json` opts into Meteor Capacitor webapp HCP with:

```json
"meteor": {
  "capacitor": {
    "hcp": "webapp"
  }
}
```

System information uses `imports/ui/native/hcp.js` as a small bridge around the native
`window.WebAppLocalServer` API. `listenForHcpUpdates` subscribes to
`onNewVersionReady`, `checkForHcpUpdates` calls `checkForUpdates`, and
`applyHcpUpdate` calls `switchToPendingVersion`. When a native update is ready,
`App.jsx` opens an app-themed Framework7 sheet that explains the update and offers
"Install update" or "Not now".

The "Preview dialog" button is a deterministic demo and test path. It opens the
same dialog without requiring a second server deployment or native HCP download.
Playwright and Maestro use that preview path to cover the user-facing update
experience while the real listener remains wired for native builds.

## How It Is Structured

```text
imports/
  api/reports/
    collection.js    # Mongo.Collection
    fixtures.js      # Seed reports for development
    methods.js       # Draft, update, submit, and status methods
    publications.js  # Owner-scoped publication
    schema.js        # Zod validation
  ui/
    App.jsx          # Main state, navigation, native service orchestration
    pages/           # Reports, intake, detail, and System information screens
    components/      # Panel/navbar shell, report cards, status, HCP sheet
    native/          # Capacitor plugin wrappers, cleanup, and browser fallbacks
    owner.js         # Stable showcase owner helper
client/
  main.jsx           # Framework7 and React entry point
  main.css           # App-level Framework7 theme overrides
server/
  main.js            # Imports report API
tests/
  *.test.js          # Meteor method tests
e2e/
  reports.spec.js    # Playwright web flows
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
npm run test:native:civic-snap:android
npm run test:native:civic-snap:ios
npm run record:native:civic-snap:android
npm run record:native:civic-snap:ios
```

The native flow opens the Framework7 panel, checks DDP and Capacitor details on
System information, covers the HCP preview sheet, and submits a report. It avoids
camera, geolocation, notification, and share prompts for simulator reliability.
The separate recording flow captures only the community reporting journey and
writes reusable media to the external `NATIVE_SHOWCASE_OUTPUT_DIR` library.

## Troubleshooting

- If `meteor run` does not find the `capacitor` package, confirm that
  `/Users/igcogi/meteor/meteor` is first on `PATH`.
- If npm cannot resolve `@meteorjs/capacitor`, rerun the local `npm link` command
  after `meteor npm install`.
- If Playwright opens the wrong app on port 3000, stop any stale Meteor or native
  test process with `lsof -nP -iTCP:3000 -sTCP:LISTEN`.
- If camera or location actions fail on native, recheck the iOS usage strings and
  Android manifest permissions.
- If iOS launches the wrong simulator, set `METEOR_CAPACITOR_TARGET=<UDID>` before
  `meteor run ios`.

## Links

- [Meteor docs](https://docs.meteor.com/)
- [Capacitor docs](https://capacitorjs.com/docs)
- [Framework7 React](https://framework7.io/react/)
- [jam:offline](https://docs.meteor.com/community-packages/offline)
- [jam:method](https://docs.meteor.com/community-packages/jam-method)
- [jam:pub-sub](https://docs.meteor.com/community-packages/pub-sub)
