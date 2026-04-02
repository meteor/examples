**Notes Offline (formerly Chakra UI)**

- Replaced static Chakra UI demo with a functional offline-first notes app
- Removed Chakra UI / Emotion / Framer Motion; replaced with [Mantine UI](https://mantine.dev) + PostCSS
- Integrated [jam:offline](https://github.com/jamauro/offline) for IndexedDB persistence and auto-sync
- Integrated [jam:method](https://github.com/jamauro/method) for optimistic methods with offline queuing
- Integrated [jam:pub-sub](https://github.com/jamauro/pub-sub) with global subscription caching
- Integrated [jam:soft-delete](https://github.com/jamauro/soft-delete) for recoverable deletion with trash UI
- Integrated [Workbox](https://developer.chrome.com/docs/workbox) via `workbox-webpack-plugin` + Rspack for PWA service worker
- Full CRUD with auto-save, search, tags, pin, Markdown preview, export/import, dark mode, keyboard shortcuts
- Removed `autopublish` and `insecure`
