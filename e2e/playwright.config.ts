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
  },
  // NFR-50: the three engines users run. Locally E2E_BROWSERS=chromium keeps runs fast.
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Optional: reuse a locally installed Chromium instead of Playwright's download.
        ...(process.env.PW_CHROMIUM_EXECUTABLE
          ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_EXECUTABLE } }
          : {}),
      },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ].filter(
    (project) =>
      !process.env.E2E_BROWSERS || process.env.E2E_BROWSERS.split(',').includes(project.name),
  ),
});
