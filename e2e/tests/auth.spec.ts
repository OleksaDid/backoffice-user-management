import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from '../support/accessibility.js';
import { expectGreeting, newUser, signIn, signUp } from '../support/users.js';

test.describe('authentication @full', () => {
  test('UI-AUTH-02 NFR-25 visitors without a session land on sign-up', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');
    await expectNoA11yViolations(page);
  });

  test('AUTH-07 a first visit logs no errors in the console', async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account');
    expect(problems).toEqual([]);
  });

  test('buttons show the pointer cursor', async ({ page }) => {
    await page.goto('/sign-up');
    const cursor = await page
      .getByRole('button', { name: 'Sign up' })
      .evaluate((button) => getComputedStyle(button).cursor);
    expect(cursor).toBe('pointer');
  });

  test('UI-AUTH-03 sign-up and sign-in link to each other', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await expectNoA11yViolations(page);
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test('UI-AUTH-04 mismatched passwords never reach the API', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/sign-up')) {
        requests.push(request.url());
      }
    });
    await signUp(page, newUser(), 'something else');

    await expect(page.getByText('Passwords do not match')).toBeVisible();
    expect(requests).toEqual([]);
  });

  test('UI-AUTH-09 to 11 sign up, greet, log out, sign in again', async ({ page, context }) => {
    const user = newUser('Grace');

    await signUp(page, user);
    await expect(page).toHaveURL(/\/$/);
    await expectGreeting(page, user);
    await expectNoA11yViolations(page);

    // AUTH-20: the session cookie is httpOnly and scoped to the API.
    const cookie = (await context.cookies()).find((c) => c.name === 'sid');
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/api' });

    // UI-AUTH-02: the session survives a reload.
    await page.reload();
    await expectGreeting(page, user);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await signIn(page, user);
    await expectGreeting(page, user);
  });

  test('UI-AUTH-08 wrong passwords are explained', async ({ page }) => {
    const user = newUser();
    await signUp(page, user);
    await page.getByRole('button', { name: 'Log out' }).click();
    // Wait for sign-out to finish; otherwise the next page still sees the session.
    await expect(page).toHaveURL(/\/sign-in$/);

    await signIn(page, { ...user, password: 'not the password' });

    await expect(page.getByRole('alert')).toContainText('Invalid email or password.');
  });

  test('UI-AUTH-06 a taken email is reported on the email field', async ({ page }) => {
    const user = newUser();
    await signUp(page, user);
    await page.getByRole('button', { name: 'Log out' }).click();
    // Wait for sign-out to finish; otherwise the next page still sees the session.
    await expect(page).toHaveURL(/\/sign-in$/);

    await signUp(page, { ...user, firstName: 'Other' });

    await expect(page.getByText('An account with this email already exists.')).toBeVisible();
  });
});
