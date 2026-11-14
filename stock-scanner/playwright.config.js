import { defineConfig } from '@playwright/test';

const port = process.env.PORT || '3000';
const baseURL = `http://localhost:${port}`;
const meteorBin = process.env.METEOR_BIN || 'meteor';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `${meteorBin} run --port ${port}`,
    url: baseURL,
    timeout: 120000,
    // Let Meteor stop its detached Rspack processes before the next app starts.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
    reuseExistingServer: !process.env.CI,
  },
});
