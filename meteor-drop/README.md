# Meteor Drop

Meteor Drop is a mobile-first four-in-a-row game built with Meteor, React,
Konsta UI, and Capacitor. It demonstrates a native-feeling game loop while
keeping DDP, Hot Code Push, runtime details, and developer controls on a
separate System screen.

## Game Rules

1. Choose a column.
2. Your meteor falls to its lowest open space.
3. Players alternate turns.
4. The first player to connect four meteors horizontally, vertically, or
   diagonally wins.
5. A full board without a winning line is a draw.

`Play vs CPU` starts an immediate solo match. The CPU takes its turns through
server-side Meteor methods, so its moves arrive through the same reactive DDP
data path as a remote player.

`Create Live Match` opens a six-character room. A second device can use
`Join Live Match` and enter that code. The board opens automatically when both
players are present.

## Mobile Experience

- Konsta UI app shell, tab navigation, sheets, lists, and buttons
- 44 px or larger column touch targets on narrow phones
- Responsive 6-by-7 board for phones, tablets, and desktop previews
- Safe-area-aware navigation and result sheets
- Haptic move and result feedback through `@capacitor/haptics`
- Native match and room sharing through `@capacitor/share`
- Network state through `@capacitor/network`
- Android hardware-back handling through `@capacitor/app`
- Dedicated System screen for application, runtime, DDP, and HCP controls

## Run In A Browser

From this directory:

```sh
npm install
npm start
```

Open `http://localhost:3000`.

## Run A Native Target

From the repository root:

```sh
npm run run:native:meteor-drop -- ios
npm run run:native:meteor-drop -- android
```

Meteor CLI options follow `--`:

```sh
npm run run:native:meteor-drop -- android -- --mobile-server http://10.0.2.2:3000
npm run run:native:meteor-drop -- ios -- --port 3100
```

The runner accepts native options before the separator:

```sh
METEOR_CAPACITOR_MODE=livereload \
  npm run run:native:meteor-drop -- android --development -- \
  --mobile-server http://10.0.2.2:3000
```

Set `METEOR_CAPACITOR_TARGET` when more than one simulator, emulator, or device
is available.

## Live Data And HCP

Game state lives in the `meteorDropGames` Mongo collection. Client actions call
validated Meteor methods, and subscriptions publish only matches belonging to
the current local identity.

The System screen exposes:

- application version and build
- platform and Capacitor runtime
- current DDP endpoint and connection state
- DDP pause and reconnect controls
- HCP check, preview, review, and install controls

When a native HCP update is downloaded, the update dialog appears over the
current screen. Choosing `Not now` keeps the current UI running and leaves an
`Update ready` reminder. Automatic reload is gated while the dialog is open;
the user can install explicitly from the dialog.

## Project Structure

```text
client/
  main.html
  main.jsx
  main.css
imports/
  api/games/
    collection.js
    engine.js
    methods.js
    publications.js
    schema.js
    server/
      cpu.js
      gameAccess.js
      persistence.js
  ui/
    art/
      MeteorDropArt.jsx
    components/
      AppShell.jsx
      MeteorBoard.jsx
      MatchStage.jsx
      MatchResultSheet.jsx
      LiveMatchSheet.jsx
      HcpUpdateDialog.jsx
    native/
    pages/
      PlayPage.jsx
      RecordsPage.jsx
      SystemInfoPage.jsx
server/
  main.js
tests/
e2e/
```

## Tests

From this directory:

```sh
npm run lint
npm run test:headless
npm run e2e:headless
npm run test:gallery-output
```

From the repository root:

```sh
npm run test:native:unit
npm run test:native:meteor-drop:android
npm run test:native:meteor-drop:ios
npm run record:native:meteor-drop:android
npm run record:native:meteor-drop:ios
```

The browser suite covers the home screen, CPU turn synchronization, a winning
move, live-room validation, responsive board geometry, and the System/HCP
flow. Maestro covers the packaged native navigation, gameplay, records,
sharing, DDP controls, and HCP dialog.

Gallery screenshots and native recordings are written outside the repository.
Set `NATIVE_SHOWCASE_OUTPUT_DIR` to the external media library before capture.
