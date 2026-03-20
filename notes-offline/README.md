# Notes Offline

_Your notes, always available._

An offline-first notes app built with Meteor 3.4. Demonstrates IndexedDB persistence, optimistic UI, cached subscriptions, soft delete, and PWA support using the `jam:*` package family.

## Stack

|              |                                               |
| ------------ | --------------------------------------------- |
| Runtime      | Meteor 3.4                                    |
| Frontend     | React 19                                      |
| UI           | Mantine UI                                    |
| Offline      | jam:offline (IndexedDB, auto-sync, cross-tab) |
| Methods      | jam:method (optimistic, offline queuing)      |
| Pub/Sub      | jam:pub-sub (cached subscriptions)            |
| Soft Delete  | jam:soft-delete                               |
| Validation   | Zod                                           |
| PWA          | Workbox (via workbox-webpack-plugin + Rspack) |
| Code Quality | ESLint (Airbnb) + Prettier                    |
| E2E          | Playwright                                    |
| Build        | Rspack                                        |

## Features

- Create, edit, delete notes with auto-save (500ms debounce)
- Trash with recovery and permanent delete
- Search notes by title, content, or tags
- Pin important notes to the top
- Tags support
- Markdown editing with live preview
- Export/import notes as JSON
- Dark mode toggle
- Keyboard shortcuts (`Ctrl+N` new note, `Esc` deselect)
- Online/offline/syncing status indicator
- Installable as PWA, works fully offline

## Running it

```bash
meteor npm install
npm start
```

Visit `http://localhost:3000/`.

| Command                | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm start`            | Start the app                          |
| `npm run lint`         | Lint and check formatting              |
| `npm run lint:fix`     | Lint and auto-fix + format             |
| `npm run e2e`          | E2E tests (Playwright, interactive UI) |
| `npm run e2e:headless` | E2E tests (Playwright, headless)       |

Before running E2E tests for the first time, install Playwright's browsers with `npx playwright install`.

## How it's structured

```
imports/
  api/notes/
    collection.js    # Mongo.Collection + jam:soft-delete
    schema.js        # Zod schemas
    methods.js       # jam:method definitions
    publications.js  # Publications
  ui/
    App.jsx          # MantineProvider + AppShell layout
    NotesList.jsx    # Sidebar with search + note cards
    NoteEditor.jsx   # Editor with auto-save
    EmptyState.jsx   # Empty state
client/
  main.jsx           # Entry point
  main.css           # Mantine styles
server/
  main.js            # Import API modules
```

### What makes it offline-first

- `jam:offline` stores data in IndexedDB and syncs with the server when connected
- `jam:method` queues method calls while offline and replays them on reconnect
- `jam:pub-sub` caches subscription data so the app loads instantly from cache
- `jam:soft-delete` marks items as deleted instead of removing them, enabling trash and recovery
- Workbox service worker (configured through Rspack) caches pages and assets for full offline PWA support

## Deployment

- **[Galaxy](https://galaxycloud.app/)**: `meteor deploy your-app.meteorapp.com`
  - To try it quickly with a free tier and shared MongoDB: `meteor deploy your-app.meteorapp.com --free --mongo`
- **Any Node.js host**: `meteor build` gives you a standard Node bundle
- **MUP**: automated deploy to your own server over SSH

## Links

- [Meteor docs](https://docs.meteor.com/) · [Meteor guide](https://guide.meteor.com/)
- [React docs](https://react.dev/)
- [Mantine UI](https://mantine.dev/) · [Workbox](https://developer.chrome.com/docs/workbox)
- [jam:offline](https://docs.meteor.com/community-packages/offline) · [jam:method](https://docs.meteor.com/community-packages/jam-method) · [jam:pub-sub](https://docs.meteor.com/community-packages/pub-sub)
