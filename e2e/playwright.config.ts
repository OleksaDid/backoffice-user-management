import { defineConfig, devices, type Project } from '@playwright/test';

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
    // Mantine skips transitions with reduced motion, so axe never inspects a dialog that is
    // still fading in (half-transparent text fails colour contrast, seen in WebKit).
    reducedMotion: 'reduce',
  },
  projects: selectedProjects(),
});

/** NFR-50: the three engines users run; E2E_BROWSERS=chromium keeps local runs fast. */
function selectedProjects(): Project[] {
  const all: Project[] = [
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
  ];
  const wanted = process.env.E2E_BROWSERS?.split(',').map((name) => name.trim());
  if (!wanted) return all;
  const selected = all.filter((project) => wanted.includes(project.name ?? ''));
  if (selected.length !== wanted.length) {
    throw new Error(
      `E2E_BROWSERS must list chromium, firefox and/or webkit; got "${wanted.join(',')}"`,
    );
  }
  return selected;
}
