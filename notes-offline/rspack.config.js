const { defineConfig } = require('@meteorjs/rspack');
const { GenerateSW } = require('workbox-webpack-plugin');
const path = require('path');
const fs = require('fs');

// In dev, webpack-dev-server serves assets from memory so sw.js never
// hits disk. This plugin copies the generated sw.js to public/ after
// each emit so Meteor can serve it at /sw.js during development.
// In production builds Rspack writes to disk and Meteor bundles it normally.
class CopySWToPublic {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('CopySWToPublic', (compilation, callback) => {
      const swAsset = compilation.getAsset('sw.js');
      if (swAsset) {
        const dest = path.resolve(__dirname, 'public', 'sw.js');
        fs.writeFileSync(dest, swAsset.source.source());
      }
      callback();
    });
  }
}

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
          skipWaiting: false,
          clientsClaim: false,
          cleanupOutdatedCaches: true,
          inlineWorkboxRuntime: true,
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          exclude: [/\.map$/],
          // Let __rspack__ and sockjs requests bypass the service worker
          // entirely so they don't produce noisy errors when offline.
          navigateFallbackDenylist: [/__rspack__/, /sockjs/],
          runtimeCaching: [
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
              urlPattern: ({ request, url }) =>
                (request.destination === 'style' ||
                  request.destination === 'script' ||
                  request.destination === 'worker') &&
                !url.pathname.includes('/__rspack__/') &&
                !url.pathname.includes('/sockjs/'),
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
      Meteor.isClient && new CopySWToPublic(),
    ].filter(Boolean),
  };
});
