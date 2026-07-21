const { defineConfig } = require('@playwright/test');

const port = process.env.PORT || '3100';
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `PATH=/Users/igcogi/meteor/meteor:$PATH meteor run --port ${port}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
