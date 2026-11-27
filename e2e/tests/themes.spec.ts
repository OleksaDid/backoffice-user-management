import { type BrowserContextOptions, expect, type Page, test } from '@playwright/test';

import { expectNoA11yViolations } from '../support/accessibility.js';
import { newUser, signUp } from '../support/users.js';

const scheme = (page: Page) =>
  page.evaluate(() => document.documentElement.getAttribute('data-mantine-color-scheme'));

test.describe('themes @full', () => {
  test('THEME-02 System follows the operating system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/sign-up');
    await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(await scheme(page)).toBe('dark');

    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => scheme(page)).toBe('light');
  });

  test('THEME-03 the chosen theme survives closing and reopening the app', async ({
    browser,
    baseURL,
  }) => {
    const options: BrowserContextOptions = { colorScheme: 'light' };
    if (baseURL) {
      options.baseURL = baseURL;
    }
    const first = await browser.newContext(options);
    const page = await first.newPage();
    await page.goto('/sign-up');
    await page.getByText('Dark', { exact: true }).click();
    await expect.poll(() => scheme(page)).toBe('dark');
    const saved = await first.storageState();
    await first.close();

    // A brand-new browser context with only the persisted storage: the app was closed.
    const reopened = await browser.newContext({ ...options, storageState: saved });
    const again = await reopened.newPage();
    await again.goto('/sign-in');
    await expect(again.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(await scheme(again)).toBe('dark');
    await reopened.close();
  });

  test('THEME-04 the stored theme is applied before the app script runs', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByText('Dark', { exact: true }).click();
    await expect.poll(() => scheme(page)).toBe('dark');

    // Block every script except theme-init.js (production bundle and dev-server modules
    // alike): only the blocking init script can then set the scheme.
    await page.route(
      (url) => !url.pathname.endsWith('/theme-init.js'),
      (route) =>
        ['script'].includes(route.request().resourceType()) ? route.abort() : route.continue(),
    );
    await page.reload();
    expect(await scheme(page)).toBe('dark');
  });

  test('THEME-05 both themes pass the accessibility checks', async ({ page }) => {
    for (const choice of ['Light', 'Dark']) {
      await page.goto('/sign-up');
      await page.getByText(choice, { exact: true }).click();
      await expectNoA11yViolations(page);
    }
    await signUp(page, newUser('Theme'));
    await expect(page.getByRole('table')).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('THEME-06 native controls follow the theme', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByText('Dark', { exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
      .toBe('dark');
  });

  test('NFR-24 the header fits a 320 px wide screen without horizontal scrolling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await signUp(page, newUser('Narrow'));
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
