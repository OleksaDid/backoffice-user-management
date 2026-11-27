import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/errors';
import { adaAuth, mockSession, problem, renderApp } from '../test/render-app';
import { server, setupMockServer } from '../test/server';
import { createQueryClient } from './query-client';

setupMockServer();

describe('session flow', () => {
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

  it('UI-AUTH-12 a 401 from any request ends the session in the app', async () => {
    const onUnauthorized = vi.fn();
    const reporter = { report: vi.fn() };
    const client = createQueryClient({ onUnauthorized, reporter });

    await client
      .query({
        queryKey: ['users'],
        queryFn: () => Promise.reject(new ApiError(401, 'UNAUTHENTICATED', 'gone')),
      })
      .catch(() => undefined);

    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(reporter.report).not.toHaveBeenCalled();
  });

  it('ERR-23 unexpected errors are reported, expected ones are not', async () => {
    const reporter = { report: vi.fn() };
    const client = createQueryClient({ onUnauthorized: vi.fn(), reporter });

    for (const error of [new ApiError(404, 'USER_NOT_FOUND', 'x'), new TypeError('bug')]) {
      await client
        .query({ queryKey: [error.message], queryFn: () => Promise.reject(error) })
        .catch(() => undefined);
    }

    expect(reporter.report).toHaveBeenCalledOnce();
    expect(reporter.report).toHaveBeenCalledWith(expect.any(TypeError), { source: 'query' });
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
