import { randomUUID } from 'node:crypto';

import { expect, type Page } from '@playwright/test';

export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** A fresh user per test; the `e2e-` prefix marks test data on shared environments. */
export function newUser(firstName = 'Ada'): TestUser {
  return {
    firstName,
    lastName: 'Tester',
    email: `e2e-${randomUUID()}@example.com`,
    password: 'correct horse battery',
  };
}

export async function signUp(page: Page, user: TestUser, confirm = user.password): Promise<void> {
  await page.goto('/sign-up');
  await page.getByLabel('First name').fill(user.firstName);
  await page.getByLabel('Last name').fill(user.lastName);
  await page.getByLabel('Email').fill(user.email);
  // Role queries use the accessible name, which excludes the visual required marker.
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(user.password);
  await page.getByRole('textbox', { name: 'Confirm password' }).fill(confirm);
  await page.getByRole('button', { name: 'Sign up' }).click();
}

export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.getByLabel('Email').fill(user.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function expectGreeting(page: Page, user: TestUser): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Hello ${user.firstName}`);
}
