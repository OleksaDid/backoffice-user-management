import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { adaAuth, mockSession, problem, renderApp } from '../test/render-app';
import { server, setupMockServer } from '../test/server';

setupMockServer();

async function signIn(user: ReturnType<typeof renderApp>['user']) {
  await screen.findByRole('heading', { level: 1, name: 'Sign in' });
  await user.type(
    screen.getByLabelText('Email', { exact: false, selector: 'input' }),
    'ada@example.com',
  );
  await user.type(
    screen.getByLabelText('Password', { exact: false, selector: 'input' }),
    'correct horse',
  );
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('sign-in page', () => {
  it('UI-AUTH-09 signs in and forwards to the welcome page', async () => {
    mockSession(null);
    server.use(http.post('/api/auth/sign-in', () => HttpResponse.json(adaAuth)));
    const { user, router } = renderApp('/sign-in');

    await signIn(user);

    expect(await screen.findByRole('heading', { level: 1, name: 'Hello Ada' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/');
  });

  it('UI-AUTH-08 explains invalid credentials', async () => {
    mockSession(null);
    server.use(http.post('/api/auth/sign-in', () => problem(401, 'INVALID_CREDENTIALS')));
    const { user } = renderApp('/sign-in');

    await signIn(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('UI-AUTH-08 explains that the account is inactive', async () => {
    mockSession(null);
    server.use(http.post('/api/auth/sign-in', () => problem(403, 'USER_INACTIVE')));
    const { user } = renderApp('/sign-in');

    await signIn(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(/This account is inactive/);
  });

  it('UI-AUTH-12 tells the user when their session ended', async () => {
    mockSession(null);
    const { router } = renderApp('/sign-in');
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });

    await router.navigate('/sign-in', { state: { notice: 'session-ended' } });

    expect(await screen.findByText('Your session has ended. Please sign in again.')).toBeVisible();
  });
});
