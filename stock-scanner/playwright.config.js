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
    reuseExistingServer: !process.env.CI,
  },
});
