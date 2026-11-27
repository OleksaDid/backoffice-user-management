import { expect, type Page, test } from '@playwright/test';

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

  test('THEME-03 the chosen theme survives closing and reopening the app', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('/sign-up');
    await page.getByText('Dark', { exact: true }).click();
    await expect.poll(() => scheme(page)).toBe('dark');
    await page.close();

    // A new tab in the same browser profile: localStorage persists, like reopening the app.
    const reopened = await context.newPage();
    await reopened.goto('/sign-in');
    await expect(reopened.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(await scheme(reopened)).toBe('dark');
    await context.close();
  });

  test('THEME-04 the stored theme is applied before the app script runs', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByText('Dark', { exact: true }).click();
    await expect.poll(() => scheme(page)).toBe('dark');

    // Block the application bundle: only the blocking theme-init script can set the scheme.
    await page.route('**/assets/*.js', (route) => route.abort());
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
