import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { adaAuth, mockSession, problem, renderApp } from '../test/render-app';
import { server, setupMockServer } from '../test/server';

setupMockServer();

async function fillSignUp(
  user: ReturnType<typeof renderApp>['user'],
  overrides: Partial<Record<string, string>> = {},
) {
  const values = {
    'First name': 'Ada',
    'Last name': 'Lovelace',
    Email: 'ada@example.com',
    Password: 'correct horse',
    'Confirm password': 'correct horse',
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    await user.type(screen.getByLabelText(new RegExp(`^${label}`), { selector: 'input' }), value);
  }
}

describe('sign-up page', () => {
  it('UI-AUTH-02 is the default page without a session', async () => {
    mockSession(null);
    const { router } = renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Create your account' }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/sign-up');
  });

  it('UI-AUTH-04 does not call the API when the passwords do not match', async () => {
    mockSession(null);
    const signUp = vi.fn();
    server.use(
      http.post('/api/auth/sign-up', () => {
        signUp();
        return HttpResponse.json(adaAuth, { status: 201 });
      }),
    );
    const { user } = renderApp('/sign-up');
    await screen.findByRole('heading', { name: 'Create your account' });

    await fillSignUp(user, { 'Confirm password': 'battery staple' });
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Passwords do not match')).toBeVisible();
    expect(screen.getByLabelText(/^Confirm password/, { selector: 'input' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it('UI-AUTH-05 validates fields before submitting and focuses the first invalid one', async () => {
    mockSession(null);
    const { user } = renderApp('/sign-up');
    await screen.findByRole('heading', { name: 'Create your account' });

    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    const firstName = screen.getByLabelText('First name', { exact: false, selector: 'input' });
    expect(await screen.findAllByText('Must not be blank')).not.toHaveLength(0);
    expect(firstName).toHaveFocus();
  });

  it('UI-AUTH-09 UI-AUTH-10 signs up and greets the user', async () => {
    mockSession(null);
    let body: unknown;
    server.use(
      http.post('/api/auth/sign-up', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(adaAuth, { status: 201 });
      }),
    );
    const { user, router } = renderApp('/sign-up');
    await screen.findByRole('heading', { name: 'Create your account' });

    await fillSignUp(user, { Email: 'Ada@Example.com' });
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Hello Ada' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/');
    expect(body).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'correct horse',
    });
  });

  it('UI-AUTH-06 shows a duplicate email on the email field', async () => {
    mockSession(null);
    server.use(http.post('/api/auth/sign-up', () => problem(409, 'EMAIL_ALREADY_REGISTERED')));
    const { user } = renderApp('/sign-up');
    await screen.findByRole('heading', { name: 'Create your account' });

    await fillSignUp(user);
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('An account with this email already exists.')).toBeVisible();
    expect(screen.getByLabelText('Email', { exact: false, selector: 'input' })).toHaveFocus();
  });

  it('UI-AUTH-06 shows other failures as a form alert', async () => {
    mockSession(null);
    server.use(http.post('/api/auth/sign-up', () => problem(500, 'INTERNAL_ERROR')));
    const { user } = renderApp('/sign-up');
    await screen.findByRole('heading', { name: 'Create your account' });

    await fillSignUp(user);
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Something went wrong on our side/);
  });

  it('UI-AUTH-03 links to sign-in without a page reload and focuses its heading', async () => {
    mockSession(null);
    const { user, router } = renderApp('/sign-up');
    await screen.findByRole('heading', { name: 'Create your account' });

    await user.click(screen.getByRole('link', { name: 'Sign in' }));

    const heading = await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    expect(router.state.location.pathname).toBe('/sign-in');
    expect(heading).toHaveFocus();
  });
});
