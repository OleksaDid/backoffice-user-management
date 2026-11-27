import { randomUUID } from 'node:crypto';

import { expect, type Page, test } from '@playwright/test';

import { expectNoA11yViolations } from '../support/accessibility.js';
import { newUser, signUp } from '../support/users.js';

/** Creates a user through the API with the page's session (fast setup, not under test). */
async function createUserViaApi(page: Page, firstName: string) {
  const response = await page.request.post('/api/users', {
    data: {
      firstName,
      lastName: 'Fixture',
      email: `e2e-${randomUUID()}@example.com`,
      password: 'correct horse battery',
    },
  });
  expect(response.status()).toBe(201);
}

function row(page: Page, name: string | RegExp) {
  return page.getByRole('row').filter({ has: page.getByRole('rowheader', { name }) });
}

test.describe('user management dashboard @full', () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, newUser('Admin'));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hello Admin');
  });

  test('DASH-01 DASH-10 the dashboard lists users and passes axe', async ({ page }) => {
    await expect(page.getByRole('table', { name: 'Users, newest first' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: /Admin Tester/ }).first()).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test('DASH-11 to 13 shows 6 users per page and paginates through the URL', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await createUserViaApi(page, `Page${i}`);
    }
    await page.reload();

    await expect(page.getByRole('table').getByRole('row')).toHaveCount(7); // header + 6
    const nav = page.getByRole('navigation', { name: 'Pagination' });
    await nav.getByRole('button', { name: 'Page 2' }).click();

    await expect(page).toHaveURL(/\?page=2$/);
    await expect(nav.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('DASH-20 to 51 create, edit, deactivate and delete a user', async ({ page }) => {
    const tag = randomUUID().slice(0, 8);
    const first = `Kat${tag}`;

    // Create
    await page.getByRole('button', { name: 'Create user' }).click();
    const create = page.getByRole('dialog', { name: 'Create user' });
    await create.getByLabel('First name').fill(first);
    await create.getByLabel('Last name').fill('Johnson');
    await create.getByLabel('Email').fill(`e2e-${tag}@example.com`);
    await create.getByRole('textbox', { name: 'Initial password' }).fill('correct horse battery');
    await create.getByRole('textbox', { name: 'Confirm password' }).fill('correct horse battery');
    await expectNoA11yViolations(page);
    await create.getByRole('button', { name: 'Create user' }).click();
    await expect(row(page, `${first} Johnson`)).toBeVisible();

    // Edit
    await page.getByRole('button', { name: `Edit ${first} Johnson` }).click();
    const edit = page.getByRole('dialog', { name: `Edit ${first} Johnson` });
    await edit.getByLabel('Last name').fill('Goble');
    await edit.getByRole('button', { name: 'Save changes' }).click();
    await expect(row(page, `${first} Goble`)).toBeVisible();

    // Deactivate: the name becomes locked
    const toggle = page.getByRole('switch', { name: `Active status of ${first} Goble` });
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await page.getByRole('button', { name: `Edit ${first} Goble` }).click();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Save changes' }),
    ).toBeDisabled();
    await page.keyboard.press('Escape');

    // Delete
    await page.getByRole('button', { name: `Delete ${first} Goble` }).click();
    const confirm = page.getByRole('dialog', { name: `Delete ${first} Goble?` });
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await confirm.getByRole('button', { name: 'Delete user' }).click();
    await expect(row(page, `${first} Goble`)).toHaveCount(0);
  });

  test('DASH-41 the signed-in user cannot deactivate or delete themselves', async ({ page }) => {
    const own = row(page, /Admin Tester\s*You/);
    await expect(own.getByRole('switch')).toBeDisabled();
    await expect(own.getByRole('button', { name: /^Delete/ })).toBeDisabled();
  });
});
