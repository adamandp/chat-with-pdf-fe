import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3030";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45_000,
  expect: { timeout: 12_000 },
  workers: process.env.CI ? 1 : undefined,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  // Browser tests must run against the same production build that Vercel serves.
  // Parallel requests to Next's dev compiler caused router-initialization errors.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run start -- --hostname 127.0.0.1 --port 3030",
        url: "http://127.0.0.1:3030",
        reuseExistingServer: !process.env.CI,
        timeout: 90_000,
      },
});
