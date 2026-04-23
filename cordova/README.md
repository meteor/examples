# Contacts

A contacts directory that runs as a web app, PWA, and native iOS/Android app from a single codebase. Built with Meteor, Framework7, and Cordova.

## Stack

| | |
|---|---|
| Runtime | Meteor 3.4.1-rc.0 |
| Frontend | React 19 |
| UI | Framework7 v8 |
| Mobile | Cordova (iOS + Android) |
| PWA | Service worker + manifest |
| Database | MongoDB |
| Tests | Mocha |
| E2E | Playwright |
| Build | Rspack |

## Features

- Searchable, alphabetically grouped contact list
- Add, edit, delete contacts with swipe actions
- Favorite contacts (starred)
- Per-user accounts and data isolation
- Real-time sync across devices
- Browser push notifications when contacts change (no third-party service needed)
- Native iOS/Android look via Framework7 auto-theming
- PWA manifest and service worker for installable web app
- SSR meta tags (OpenGraph, Apple) for link previews
- Cordova builds for App Store and Google Play

## Running it

```bash
meteor npm install
npm start
```

Visit `http://localhost:3000/`.

| Command | What it does |
|---|---|
| `npm start` | Start the app |
| `npm run start:settings` | Start with dev settings (PWA manifest, store links) |
| `npm test` | Integration tests (Mocha, watch mode) |
| `npm run test:headless` | Integration tests (Mocha, headless/CI) |
| `npm run e2e` | E2E tests (Playwright, interactive UI) |
| `npm run e2e:headless` | E2E tests (Playwright, headless) |

Before running E2E tests for the first time, install Playwright's browsers with `npx playwright install`.

## How it's structured

```
imports/
  api/
    contacts.js              # Collection, methods, publication
  infra/
    constants.js             # App name, colors, branding
    native.js                # Native store config from settings
    meta-tags.js             # SSR-injected OpenGraph/Apple meta tags
    pwa-json.js              # PWA manifest generation
    apple-app-site-association.js
    notifications.js         # Browser push notifications (Notification API)
    serviceWorkerInit.js     # Service worker registration
  ui/
    App.jsx                  # Framework7 app + routes
    helpers.js               # Avatar colors, initials, grouping
    pages/
      ContactsPage.jsx       # Contact list with search, swipe, fab
      ContactDetailPage.jsx  # Contact detail view
      ContactFormPage.jsx    # Add/edit contact form
      LoginPage.jsx          # Authentication (login/register)
client/
  main.js                    # Entry point, Framework7 init
  main.html                  # Shell HTML with PWA meta tags
  main.css                   # Custom styles (avatars, detail header)
server/
  main.js                    # Import API, wire up endpoints, settings warning
public/
  sw.js                      # Service worker (offline caching)
mobile-config.js             # Cordova config (icons, splash, universal links)
tests/
  main.js                    # Mocha integration tests
e2e/
  contacts.spec.js           # Playwright E2E tests
```

## Native builds

This app includes full Cordova configuration for building native iOS and Android apps. Framework7's `theme: 'auto'` automatically renders iOS-style UI on iPhones and Material Design on Android.

### Prerequisites

- **iOS**: macOS with Xcode, an Apple Developer account
- **Android**: Android Studio with SDK

### Running on simulators

```bash
# iOS simulator
meteor run ios

# Android emulator
meteor run android
```

### Production builds

```bash
cd private/native-app/production
chmod a+x build.sh
./build.sh
```

### Configuration

1. Edit `mobile-config.js` to set your app ID, name, and universal link domain
2. Edit `private/env/production/settings.json` with your Apple and Google store IDs
3. Generate icons (1024x1024) and splash screens (2732x2732), place in `private/assets/`
4. See `private/native-app/production/` for build and publish scripts (Fastlane)

### Store submission

- **iOS**: build script outputs an Xcode project → Archive → Distribute to App Store → TestFlight
- **Android**: build script outputs a signed AAB → upload to Google Play Console

See `private/native-app/production/publish-ios.sh` and `publish-android.sh` for automated submission via Fastlane.

## Deployment

- **[Galaxy](https://galaxycloud.app/)**: `meteor deploy your-app.meteorapp.com`
  - To try it quickly with a free tier and shared MongoDB: `meteor deploy your-app.meteorapp.com --free --mongo`
- **Any Node.js host**: `meteor build` gives you a standard Node bundle
- **MUP**: automated deploy to your own server over SSH

## Links

- [Meteor docs](https://docs.meteor.com/) · [Meteor guide](https://guide.meteor.com/)
- [React docs](https://react.dev/)
- [Framework7](https://framework7.io/) · [Framework7 React](https://framework7.io/react/)
- [Meteor Cordova guide](https://guide.meteor.com/mobile)
