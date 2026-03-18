# Notes Offline

*Your notes, always available.*

A minimal offline-first notes app built with Meteor 3.4 demonstrating instant startup, IndexedDB persistence, optimistic UI, and PWA support.

## What This Demonstrates

- **Offline-first architecture** with `jam:offline` — IndexedDB persistence, auto-sync, cross-tab data sharing
- **Optimistic methods** with `jam:method` — instant UI updates that queue when offline and replay on reconnect
- **Cached subscriptions** with `jam:pub-sub` — data loads instantly from cache
- **Soft delete** with `jam:soft-delete` — recoverable deletion with trash view, recovery, and permanent delete
- **PWA** with [Workbox](https://developer.chrome.com/docs/workbox) via `workbox-webpack-plugin` + Rspack — installable app with service worker caching (NetworkFirst for pages, StaleWhileRevalidate for assets, CacheFirst for images)
- **Mantine UI** — modern React component library with PostCSS integration

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
- Installable as PWA — works fully offline

## Running

```bash
meteor npm install
meteor
```

## Stack

| Technology | Purpose |
|---|---|
| [Meteor 3.4](https://docs.meteor.com) | Full-stack framework |
| [Rspack](https://rspack.dev) | Bundler |
| [React 19](https://react.dev) | UI library |
| [Mantine UI](https://mantine.dev) | Component library |
| [jam:offline](https://docs.meteor.com/community-packages/offline) | IndexedDB persistence |
| [jam:method](https://docs.meteor.com/community-packages/jam-method) | Typed methods with offline queuing |
| [jam:pub-sub](https://docs.meteor.com/community-packages/pub-sub) | Cached subscriptions |
| [jam:soft-delete](https://docs.meteor.com/community-packages/soft-delete) | Soft delete support |
| [Zod](https://zod.dev) | Schema validation |
| [Workbox](https://developer.chrome.com/docs/workbox) | PWA service worker via `workbox-webpack-plugin` + Rspack |

## Project Structure

```
imports/
  api/notes/
    collection.js   # Mongo.Collection + jam:soft-delete
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
  main.html          # HTML template
server/
  main.js            # Import API modules
```
