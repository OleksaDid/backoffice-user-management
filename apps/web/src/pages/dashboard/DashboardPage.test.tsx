import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { fakeUsersApi, makeUser } from '../../test/fake-users-api';
import { adaAuth, mockSession, problem, renderApp } from '../../test/render-app';
import { setupMockServer } from '../../test/server';

setupMockServer();

function rows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1);
}

async function openDashboard(path = '/') {
  mockSession(adaAuth);
  const view = renderApp(path);
  // The dashboard is a lazily loaded route; the first import takes a moment in tests.
  await screen.findByRole('table', {}, { timeout: 5000 });
  return view;
}

describe('dashboard: listing and pagination', () => {
  it('DASH-01 replaces the welcome page and keeps the greeting', async () => {
    fakeUsersApi();
    await openDashboard();
    expect(screen.getByRole('heading', { level: 1, name: 'Hello Ada' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeVisible();
  });

  it('DASH-10 shows users in a captioned table and marks the current user', async () => {
    fakeUsersApi([
      makeUser({ firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com' }),
    ]);
    await openDashboard();

    const table = screen.getByRole('table', { name: 'Users, newest first' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual([
      'Name',
      'Email',
      'Status',
      'Logins',
      'Created',
      'Last updated',
      'Actions',
    ]);
    expect(within(table).getByRole('rowheader', { name: /Ada Lovelace/ })).toHaveTextContent('You');
    expect(within(table).getByText('grace@example.com')).toBeVisible();
  });

  it('DASH-11 DASH-12 shows 6 users per page and keeps the page in the URL', async () => {
    const api = fakeUsersApi(Array.from({ length: 8 }, () => makeUser()));
    const { user, router } = await openDashboard();

    expect(rows()).toHaveLength(6);
    expect(api.calls[0]?.url).toBe('/api/users');

    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    await user.click(within(nav).getByRole('button', { name: 'Page 2' }));

    await waitFor(() => {
      expect(rows()).toHaveLength(3);
    });
    expect(router.state.location.search).toBe('?page=2');
    expect(within(nav).getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('DASH-12 opens the page from the URL and treats invalid values as page 1', async () => {
    fakeUsersApi(Array.from({ length: 8 }, () => makeUser()));
    await openDashboard('/?page=2');
    expect(rows()).toHaveLength(3);
  });

  it('DASH-13 hides pagination when everything fits on one page', async () => {
    fakeUsersApi([makeUser()]);
    await openDashboard('/?page=abc');
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('DASH-14 moves to the last page when the requested one no longer exists', async () => {
    fakeUsersApi(Array.from({ length: 7 }, () => makeUser()));
    const { router } = renderApp('/?page=5');
    mockSession(adaAuth);

    await waitFor(() => {
      expect(router.state.location.search).toBe('?page=2');
    });
  });

  it('DASH-15 offers a retry when the list cannot be loaded', async () => {
    mockSession(adaAuth);
    const { server } = await import('../../test/server');
    const { http } = await import('msw');
    server.use(http.get('/api/users', () => problem(500, 'INTERNAL_ERROR')));
    const { user } = renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(/Users could not be loaded/);
    fakeUsersApi();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });
});

describe('dashboard: create, edit, status, delete', () => {
  it('DASH-20 DASH-21 creates a user and shows it on page 1', async () => {
    const api = fakeUsersApi(Array.from({ length: 7 }, () => makeUser()));
    const { user, router } = await openDashboard('/?page=2');

    await user.click(screen.getByRole('button', { name: 'Create user' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create user' });
    await user.type(within(dialog).getByLabelText(/^First name/), 'Katherine');
    await user.type(within(dialog).getByLabelText(/^Last name/), 'Johnson');
    await user.type(within(dialog).getByLabelText(/^Email/), 'katherine@example.com');
    await user.type(within(dialog).getByLabelText(/^Initial password/), 'correct horse');
    await user.type(within(dialog).getByLabelText(/^Confirm password/), 'correct horse');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

    expect(await screen.findByText('Katherine Johnson was created.')).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(router.state.location.search).toBe('');
    expect(await screen.findByRole('rowheader', { name: 'Katherine Johnson' })).toBeVisible();
    expect(api.calls.find((call) => call.method === 'POST')?.body).toEqual({
      firstName: 'Katherine',
      lastName: 'Johnson',
      email: 'katherine@example.com',
      password: 'correct horse',
    });
  });

  it('DASH-20 does not send mismatched passwords; DASH-21 shows a taken email on its field', async () => {
    const api = fakeUsersApi([makeUser({ email: 'taken@example.com' })]);
    const { user } = await openDashboard();

    await user.click(screen.getByRole('button', { name: 'Create user' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create user' });
    await user.type(within(dialog).getByLabelText(/^First name/), 'Dup');
    await user.type(within(dialog).getByLabelText(/^Last name/), 'User');
    await user.type(within(dialog).getByLabelText(/^Email/), 'taken@example.com');
    await user.type(within(dialog).getByLabelText(/^Initial password/), 'correct horse');
    await user.type(within(dialog).getByLabelText(/^Confirm password/), 'something else');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

    expect(await within(dialog).findByText('Passwords do not match')).toBeVisible();
    expect(api.calls.some((call) => call.method === 'POST')).toBe(false);

    await user.clear(within(dialog).getByLabelText(/^Confirm password/));
    await user.type(within(dialog).getByLabelText(/^Confirm password/), 'correct horse');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

    expect(
      await within(dialog).findByText('An account with this email already exists.'),
    ).toBeVisible();
    expect(screen.getByRole('dialog', { name: 'Create user' })).toBeVisible();
  });

  it('DASH-30 DASH-32 edits first and last name', async () => {
    fakeUsersApi([makeUser({ firstName: 'Grace', lastName: 'Hopper' })]);
    const { user } = await openDashboard();

    await user.click(screen.getByRole('button', { name: 'Edit Grace Hopper' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Grace Hopper' });
    const firstName = within(dialog).getByLabelText(/^First name/);
    expect(firstName).toHaveValue('Grace');
    await user.clear(firstName);
    await user.type(firstName, 'Rear Admiral Grace');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('rowheader', { name: 'Rear Admiral Grace Hopper' }),
    ).toBeVisible();
  });

  it('DASH-31 locks the names of inactive users and explains why', async () => {
    fakeUsersApi([makeUser({ firstName: 'Ina', lastName: 'Active', status: 'inactive' })]);
    const { user } = await openDashboard();

    await user.click(screen.getByRole('button', { name: 'Edit Ina Active' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Ina Active' });

    expect(within(dialog).getByText(/Activate them first/)).toBeVisible();
    expect(within(dialog).getByLabelText(/^First name/)).toHaveAttribute('readonly');
    expect(within(dialog).getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('DASH-40 toggles the status immediately with its own request', async () => {
    const api = fakeUsersApi([makeUser({ firstName: 'Grace', lastName: 'Hopper' })]);
    const { user } = await openDashboard();

    const toggle = screen.getByRole('switch', { name: 'Active status of Grace Hopper' });
    expect(toggle).toBeChecked();
    await user.click(toggle);

    expect(await screen.findByText('Grace Hopper is now inactive.')).toBeVisible();
    await waitFor(() => {
      expect(
        screen.getByRole('switch', { name: 'Active status of Grace Hopper' }),
      ).not.toBeChecked();
    });
    const statusCall = api.calls.find((call) => call.method === 'PUT');
    expect(statusCall).toMatchObject({ body: { status: 'inactive' } });
  });

  it('DASH-41 the own status switch and delete action are disabled', async () => {
    fakeUsersApi();
    await openDashboard();
    expect(screen.getByRole('switch', { name: 'Active status of Ada Lovelace' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Ada Lovelace' })).toBeDisabled();
  });

  it('DASH-42 a failed status change keeps the switch and announces the error', async () => {
    const api = fakeUsersApi([makeUser({ firstName: 'Grace', lastName: 'Hopper' })]);
    api.failNext('PUT', () => problem(500, 'INTERNAL_ERROR'));
    const { user } = await openDashboard();

    await user.click(screen.getByRole('switch', { name: 'Active status of Grace Hopper' }));

    expect(await screen.findByText(/Something went wrong on our side/)).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Active status of Grace Hopper' })).toBeChecked();
  });

  it('DASH-50 DASH-51 deletes after a confirmation that names the user', async () => {
    fakeUsersApi([
      makeUser({ firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com' }),
    ]);
    const { user } = await openDashboard();

    await user.click(screen.getByRole('button', { name: 'Delete Grace Hopper' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Grace Hopper?' });
    expect(within(dialog).getByText(/grace@example.com/)).toBeVisible();
    await waitFor(() => {
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });
    await user.click(within(dialog).getByRole('button', { name: 'Delete user' }));

    expect(await screen.findByText('Grace Hopper was deleted.')).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByRole('rowheader', { name: 'Grace Hopper' })).not.toBeInTheDocument();
    });
  });

  it('DASH-60 Escape closes a dialog and returns focus to the control that opened it', async () => {
    fakeUsersApi([makeUser({ firstName: 'Grace', lastName: 'Hopper' })]);
    const { user } = await openDashboard();
    const trigger = screen.getByRole('button', { name: 'Edit Grace Hopper' });

    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
});
