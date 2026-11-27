import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a running stack: the Compose stack in CI
 * (http://localhost:8080), staging after a deployment, or a dev server locally.
 * Set E2E_BASE_URL to target another environment.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Optional: reuse a locally installed browser instead of Playwright's download.
    ...(process.env.PW_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_EXECUTABLE } }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
