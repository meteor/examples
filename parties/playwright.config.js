import { defineConfig } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  workers: 1,
  testDir: "./e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
    launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH },
    screenshot: "only-on-failure",
  },
  webServer: process.env.TEST_EXTERNAL_SERVER ? undefined : {
    command: "npm start",
    url: baseURL,
    timeout: 120000,
    reuseExistingServer: false,
  },
});
