import type { User } from '@backoffice/contracts';
import { http, HttpResponse } from 'msw';

import { adaAuth, problem } from './render-app';
import { server } from './server';

let sequence = 0;

export function makeUser(overrides: Partial<User> = {}): User {
  sequence += 1;
  const created = new Date(Date.UTC(2026, 2, 1, 10, 0, 0) - sequence * 60_000).toISOString();
  return {
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    firstName: `User${sequence}`,
    lastName: 'Example',
    email: `user${sequence}@example.com`,
    status: 'active',
    loginsCount: sequence,
    createdAt: created,
    updatedAt: created,
    ...overrides,
  };
}

/**
 * An in-memory users API behind MSW: list with pagination, create, update, status and
 * delete, with the API's conflict rules. The signed-in admin (Ada) is the first user.
 */
export function fakeUsersApi(others: User[] = []) {
  const users: User[] = [adaAuth.user, ...others];
  const calls: { method: string; url: string; body?: unknown }[] = [];
  const failures = new Map<string, () => Response>();

  const find = (id: unknown) => users.find((user) => user.id === id);
  const track = async (request: Request) => {
    const body: unknown =
      request.method === 'GET' || request.method === 'DELETE'
        ? undefined
        : await request.clone().json();
    calls.push({ method: request.method, url: new URL(request.url).pathname, body });
  };

  server.use(
    http.get('/api/users', async ({ request }) => {
      await track(request);
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 6);
      const sorted = [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return HttpResponse.json({
        items: sorted.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        totalItems: users.length,
        totalPages: Math.ceil(users.length / pageSize),
      });
    }),
    http.post('/api/users', async ({ request }) => {
      await track(request);
      const failure = failures.get('POST');
      if (failure) return failure();
      const body = (await request.json()) as { firstName: string; lastName: string; email: string };
      if (users.some((user) => user.email === body.email)) {
        return problem(409, 'EMAIL_ALREADY_REGISTERED');
      }
      const created = makeUser({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        loginsCount: 0,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      });
      users.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
    http.patch('/api/users/:id', async ({ request, params }) => {
      await track(request);
      const user = find(params.id);
      if (!user) return problem(404, 'USER_NOT_FOUND');
      if (user.status === 'inactive') return problem(409, 'USER_NAME_LOCKED');
      Object.assign(user, await request.json());
      return HttpResponse.json(user);
    }),
    http.put('/api/users/:id/status', async ({ request, params }) => {
      await track(request);
      const failure = failures.get('PUT');
      if (failure) return failure();
      const user = find(params.id);
      if (!user) return problem(404, 'USER_NOT_FOUND');
      Object.assign(user, await request.json());
      return HttpResponse.json(user);
    }),
    http.delete('/api/users/:id', async ({ request, params }) => {
      await track(request);
      const index = users.findIndex((user) => user.id === params.id);
      if (index < 0) return problem(404, 'USER_NOT_FOUND');
      users.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }),
  );

  return {
    users,
    calls,
    /** Makes the next requests with this method fail with the given response. */
    failNext(method: 'POST' | 'PUT', response: () => Response) {
      failures.set(method, response);
    },
  };
}
