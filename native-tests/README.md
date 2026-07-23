# Native example tests and showcase recordings

Maestro flows for Capacitor example apps in this repository. Smoke flows assert
native runtime behavior. Separate showcase flows record concise, user-facing
journeys, including selected native sharing and HCP interactions.

## Prerequisites

- Meteor checkout with Capacitor support: `/Users/igcogi/meteor/meteor`
- Maestro CLI
- Android emulator or iOS Simulator

Set checkout binary when needed:

```sh
export METEOR_BIN=/Users/igcogi/meteor/meteor/meteor
export PATH=/Users/igcogi/meteor/meteor:$PATH
```

## Run Web Checks

```sh
npm run test:mobile-examples
```

This installs each app through the checkout Meteor binary, then runs lint,
links local checkout npm packages with `npm link --no-save`, then runs lint,
Meteor method tests, and Playwright web E2E with `CI=1`.

## Run Native Apps

From the repository root, launch any example through the adjacent Meteor
checkout and its local Capacitor packages:

```sh
npm run run:native -- stock-scanner ios
npm run run:native -- civic-snap android
npm run run:native -- meteor-drop ios
```

App-specific shortcuts accept the platform as their first argument:

```sh
npm run run:native:stock-scanner -- android
npm run run:native:civic-snap -- ios
npm run run:native:meteor-drop -- android
```

The launcher verifies that the checkout is on `capacitor-integration`, runs
`meteor npm install`, links local `meteor-capacitor` and `meteor-rspack`
packages, adds a missing platform, then starts `meteor run <platform>`. It never
switches branches or removes generated native projects.

Bundled native runs default to Meteor's `--production` bundling mode so Rspack
emits a complete client bundle that the native HCP runtime can download and
launch. Use the runner's `--development` option only for livereload work where
the app remains attached to the development server.

Each official native example registers a Meteor reload migration gate before
mounting its UI. HCP downloads remain pending until the user confirms the global
update dialog; dismissing the dialog never refreshes the active WebView.

Runner options must appear before Meteor options. Unknown options after the app
and platform, including options left after npm consumes `--`, pass unchanged to
`meteor run`. A second separator remains supported:

```sh
npm run run:native:stock-scanner -- ios -- --port 3100
METEOR_CAPACITOR_MODE=livereload npm run run:native -- meteor-drop android --development -- --mobile-server 10.0.2.2:3000
METEOR_CAPACITOR_TARGET="DEVICE_ID" npm run run:native -- stock-scanner ios
npm run run:native -- civic-snap ios --skip-install --skip-link --dry-run
```

Use `METEOR_CHECKOUT` or `--meteor-checkout` for another local checkout.
`METEOR_BIN` alone derives its checkout from the binary's parent directory; when
both environment variables are set, they must identify the same checkout. Use
`METEOR_CAPACITOR_BRANCH` or `--expected-branch` when its branch has another
name. `--skip-branch-check` permits an intentional detached or alternate
checkout. Run `npm run run:native -- --help` for the full interface.

Before launch, the runner also applies app-declared native requirements to the
generated project: Stock Scanner's Android SDK floor and camera permissions,
plus Stock Scanner and Civic Snap iOS usage descriptions and Civic Snap Android
location permissions.

## Run Native Smoke

In one terminal, start the target app:

```sh
npm run run:native:stock-scanner -- android
```

In another terminal from repository root:

```sh
npm run test:native:stock-scanner:android
npm run test:native:civic-snap:android
npm run test:native:meteor-drop:android
npm run test:native:stock-scanner:ios
npm run test:native:civic-snap:ios
npm run test:native:meteor-drop:ios
```

Flows avoid camera, barcode, geolocation, notification, and share prompts. They
open each app's **System information** screen to assert version/runtime markers,
DDP connection, and the deterministic Hot Code Push preview. They then return to
the primary workflow for a short touch interaction inside the web view. Meteor
Drop plays a deterministic four-move win against the CPU, verifies Records,
toggles DDP, previews HCP, and creates a live room.

## Record Showcase Media

Set an output library outside the examples checkout. The runner rejects paths
inside this repository.

```sh
export NATIVE_SHOWCASE_OUTPUT_DIR=/absolute/path/to/native-app-showcase

npm run record:native:stock-scanner:ios
npm run record:native:civic-snap:ios
npm run record:native:meteor-drop:ios
```

Android variants use the same command names with `:android`. The native app must
already be installed, openable by its app ID, and connected to its Meteor server.
`MAESTRO_DEVICE`, `MAESTRO_IOS_DEVICE`, and `MAESTRO_ANDROID_DEVICE` can select a
specific simulator or emulator.

Each successful run creates:

```text
<output>/<app>/videos/<app>-<platform>.mp4
<output>/<app>/screenshots/<app>-<platform>-poster.png
<output>/<app>/runs/<timestamp>-<platform>/
<output>/manifest.json
```

The timestamped run contains the original capture, poster, JUnit report, Maestro
debug output, and logs. A failed run stays in `runs/` and never replaces the
latest stable video or poster.
