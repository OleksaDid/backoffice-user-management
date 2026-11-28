import type { AuthResponse } from '@backoffice/contracts';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';

import { AppProviders } from '../app/AppProviders';
import { createQueryClient } from '../app/query-client';
import { createRoutes } from '../app/routes';
import { server } from './server';

export const adaAuth: AuthResponse = {
  user: {
    id: '0b9f4c1e-5d6a-4c55-9c33-6e0f2f2d9a11',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    status: 'active',
    loginsCount: 1,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  session: {
    id: '5f1b9b8e-2a4c-4f6e-9d3a-1c2b3d4e5f60',
    userId: '0b9f4c1e-5d6a-4c55-9c33-6e0f2f2d9a11',
    createdAt: '2026-03-01T10:00:00.000Z',
    expiresAt: '2026-03-08T10:00:00.000Z',
    terminatedAt: null,
  },
};

export function problem(status: number, code: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json(
    { type: 'urn:test', title: code, status, code, detail: code, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

/** Mocks GET /api/auth/me: signed in as `auth`, or 401 when null. */
export function mockSession(auth: AuthResponse | null) {
  server.use(
    http.get('/api/auth/me', () =>
      // Like the API (AUTH-07), /auth/me never includes the session id.
      auth
        ? HttpResponse.json({ user: auth.user, session: { ...auth.session, id: undefined } })
        : HttpResponse.json({ user: null, session: null }),
    ),
  );
}

/** Renders the whole app with the production routes, guards and query client at `path`. */
export function renderApp(path = '/') {
  const reporter = { report: vi.fn() };
  const router = createMemoryRouter(createRoutes(), { initialEntries: [path] });
  const queryClient = createQueryClient(reporter);
  // Keep the production retry policy but without the backoff delay.
  queryClient.setDefaultOptions({
    ...queryClient.getDefaultOptions(),
    queries: { ...queryClient.getDefaultOptions().queries, retryDelay: 0 },
  });
  const user = userEvent.setup();
  const view = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, user, router, queryClient, reporter };
}
