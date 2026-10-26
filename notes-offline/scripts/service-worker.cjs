const { generateSW } = require('workbox-build');

generateSW({
  globDirectory: 'public',
  globPatterns: ['favicon.ico'],
  swDest: 'public/sw.js',
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  inlineWorkboxRuntime: true,
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  runtimeCaching: [
    { urlPattern: /\.hot-update\./, handler: 'NetworkOnly' },
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 15,
        expiration: { maxEntries: 20 },
      },
    },
    {
      urlPattern: /\/(?:packages|app)\/|[?&](?:hash|meteor_css_resource|meteor_js_resource)=/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'bundles', matchOptions: { ignoreVary: true } },
    },
    {
      urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'assets',
        cacheableResponse: { statuses: [200] },
        expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
      handler: 'CacheFirst',
      options: { cacheName: 'images', expiration: { maxEntries: 30 }, matchOptions: { ignoreVary: true } },
    },
  ],
}).then(({ warnings }) => {
  for (const warning of warnings) console.warn(warning);
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
