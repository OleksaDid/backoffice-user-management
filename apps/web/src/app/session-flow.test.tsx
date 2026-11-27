import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';
import { fakeUsersApi } from '../test/fake-users-api';
import { adaAuth, mockSession, problem, renderApp } from '../test/render-app';
import { server, setupMockServer } from '../test/server';
import { createQueryClient } from './query-client';

setupMockServer();

describe('session flow', () => {
  beforeEach(() => {
    fakeUsersApi();
  });

  it('UI-AUTH-02 UI-AUTH-10 a signed-in user is forwarded to the welcome page', async () => {
    mockSession(adaAuth);
    const { router } = renderApp('/sign-in');

    expect(await screen.findByRole('heading', { level: 1, name: 'Hello Ada' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/');
  });

  it('UI-AUTH-02 unknown paths fall back to the start page', async () => {
    mockSession(null);
    const { router } = renderApp('/does/not/exist');

    await screen.findByRole('heading', { name: 'Create your account' });
    expect(router.state.location.pathname).toBe('/sign-up');
  });

  it('UI-AUTH-11 logs out and returns to sign-in', async () => {
    mockSession(adaAuth);
    const signOut = vi.fn();
    server.use(
      http.post('/api/auth/sign-out', () => {
        signOut();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user, router } = renderApp('/');
    await screen.findByRole('heading', { name: 'Hello Ada' });

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/sign-in');
    expect(signOut).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
  });

  it('UI-AUTH-11 still leaves the app when the sign-out request fails', async () => {
    mockSession(adaAuth);
    server.use(http.post('/api/auth/sign-out', () => problem(500, 'INTERNAL_ERROR')));
    const { user } = renderApp('/');
    await screen.findByRole('heading', { name: 'Hello Ada' });

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  });

  it('UI-AUTH-12 a 401 from any request ends the session and explains it on sign-in', async () => {
    mockSession(adaAuth);
    const { queryClient, router, reporter } = renderApp('/');
    await screen.findByRole('heading', { name: 'Hello Ada' });

    // Any protected request that finds the session gone, e.g. the users list in Part 2.
    await queryClient
      .query({
        queryKey: ['users'],
        queryFn: () => Promise.reject(new ApiError(401, 'UNAUTHENTICATED', 'gone')),
      })
      .catch(() => undefined);

    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/sign-in');
    expect(screen.getByText('Your session has ended. Please sign in again.')).toBeVisible();
    expect(reporter.report).not.toHaveBeenCalled();
  });

  it('ERR-23 unexpected errors are reported, expected ones are not', async () => {
    const reporter = { report: vi.fn() };
    const client = createQueryClient(reporter);

    for (const error of [new ApiError(404, 'USER_NOT_FOUND', 'x'), new TypeError('bug')]) {
      await client
        .query({ queryKey: [error.message], queryFn: () => Promise.reject(error), retry: false })
        .catch(() => undefined);
    }

    expect(reporter.report).toHaveBeenCalledOnce();
    expect(reporter.report).toHaveBeenCalledWith(expect.any(TypeError), { source: 'query' });
  });

  it('UI-AUTH-01 a failing session check offers a retry instead of breaking the app', async () => {
    let calls = 0;
    server.use(
      http.get('/api/auth/me', () => {
        calls += 1;
        return calls <= 3 ? problem(503, 'SERVICE_UNAVAILABLE') : HttpResponse.json(adaAuth);
      }),
    );
    const { user } = renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/);
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Hello Ada' })).toBeVisible();
    expect(calls).toBe(4);
  });

  it('DASH-02 renders landmarks and a skip link to the main content', async () => {
    mockSession(adaAuth);
    renderApp('/');
    await screen.findByRole('heading', { name: 'Hello Ada' });

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
  });
});
