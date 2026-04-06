const { defineConfig } = require('@meteorjs/rspack');
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = defineConfig((Meteor) => {
  return {
    module: {
      rules: [
        Meteor.isClient && {
          test: /\.css$/,
          use: ['postcss-loader'],
          type: 'css/auto',
        },
      ].filter(Boolean),
    },
    plugins: [
      Meteor.isClient &&
        new GenerateSW({
          swDest: 'sw.js',
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          inlineWorkboxRuntime: true,
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          exclude: [/\.map$/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.includes('/__rspack__/'),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 15,
                expiration: {
                  maxEntries: 20,
                },
              },
            },
            {
              urlPattern: ({ request }) =>
                request.destination === 'style' ||
                request.destination === 'script' ||
                request.destination === 'worker',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'assets',
                cacheableResponse: {
                  statuses: [200],
                },
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 7 * 24 * 60 * 60,
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 30 },
                matchOptions: { ignoreVary: true },
              },
            },
          ],
        }),
    ].filter(Boolean),
  };
});
