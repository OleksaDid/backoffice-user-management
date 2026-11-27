import type { AuthResponse, Paginated, Session, User } from '@backoffice/contracts';
import { describe, expect, it } from 'vitest';

import { uniqueEmail, useIntegrationApp } from '../support/integration.js';

const ctx = useIntegrationApp();
const MISSING_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

async function createUser(body: Record<string, unknown> = {}): Promise<User> {
  const response = await ctx.inject({
    method: 'POST',
    url: '/api/users',
    payload: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: uniqueEmail(),
      password: 'correct horse',
      ...body,
    },
  });
  expect(response.statusCode).toBe(201);
  return response.json<User>();
}

async function signIn(user: User): Promise<Session> {
  const response = await ctx.app.inject({
    method: 'POST',
    url: '/api/auth/sign-in',
    payload: { email: user.email, password: 'correct horse' },
  });
  expect(response.statusCode).toBe(200);
  return response.json<AuthResponse>().session;
}

async function listUsers(query = '') {
  const response = await ctx.inject({ url: `/api/users${query}` });
  return { response, body: response.json<Paginated<User>>() };
}

describe('users API (integration)', () => {
  it('AUTH-08 every users endpoint requires a session', async () => {
    const id = ctx.admin.user.id;
    for (const request of [
      { method: 'GET' as const, url: '/api/users' },
      { method: 'POST' as const, url: '/api/users', payload: {} },
      { method: 'PATCH' as const, url: `/api/users/${id}`, payload: {} },
      { method: 'PUT' as const, url: `/api/users/${id}/status`, payload: {} },
      { method: 'DELETE' as const, url: `/api/users/${id}` },
    ]) {
      const response = await ctx.app.inject(request);
      expect(response.statusCode, `${request.method} ${request.url}`).toBe(401);
      expect(response.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
    }
  });

  it('USR-01 creates a user with zero logins and updatedAt equal to createdAt', async () => {
    const user = await createUser({ firstName: '  Ada ' });

    expect(user).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      status: 'active',
      loginsCount: 0,
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    });
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await createUser({ status: 'inactive' })).toMatchObject({ status: 'inactive' });
  });

  it('USR-02 NFR-13 rejects unknown and read-only fields', async () => {
    const response = await ctx.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        firstName: 'Ada',
        lastName: '',
        email: uniqueEmail(),
        password: 'correct horse',
        loginsCount: 5,
        createdAt: '2020-01-01',
      },
    });

    expect(response.statusCode).toBe(400);
    const paths = response
      .json<{ errors: { path: string }[] }>()
      .errors.map((error) => error.path)
      .sort();
    expect(paths).toEqual(['createdAt', 'lastName', 'loginsCount']);
  });

  it('AUTH-12 NFR-41 stores a password hash and returns exactly the user contract', async () => {
    const user = await createUser({ email: 'Grace@Example.com' });

    expect(user.email).toBe('grace@example.com');
    expect(JSON.stringify(user)).not.toContain('correct horse');
    expect(user).not.toHaveProperty('password');
    expect(Object.keys(user).sort()).toEqual([
      'createdAt',
      'email',
      'firstName',
      'id',
      'lastName',
      'loginsCount',
      'status',
      'updatedAt',
    ]);
    const stored = await ctx.database.pool.query<{ password_hash: string }>(
      'select password_hash from user_credentials where user_id = $1',
      [user.id],
    );
    expect(stored.rows[0]?.password_hash).toMatch(/^scrypt\$/);
  });

  it('AUTH-12 rejects a duplicate email regardless of case and creates nothing', async () => {
    await createUser({ email: 'ada@example.com' });

    const response = await ctx.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        firstName: 'Other',
        lastName: 'Person',
        email: 'ADA@example.com',
        password: 'correct horse',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'EMAIL_ALREADY_REGISTERED' });
    expect((await listUsers()).body.totalItems).toBe(2);
  });

  it('AUTH-12 requires an email and a valid password', async () => {
    for (const payload of [
      { firstName: 'A', lastName: 'B', password: 'correct horse' },
      { firstName: 'A', lastName: 'B', email: 'not-an-email', password: 'correct horse' },
      { firstName: 'A', lastName: 'B', email: uniqueEmail(), password: 'short' },
    ]) {
      const response = await ctx.inject({ method: 'POST', url: '/api/users', payload });
      expect(response.statusCode, JSON.stringify(payload)).toBe(400);
    }
  });

  it('USR-03 returns a page with totals', async () => {
    for (let i = 0; i < 8; i++) {
      await createUser({ firstName: `User${i}` });
      ctx.clock.advance(1000);
    }

    const { response, body } = await listUsers('?page=2');

    // Eight created users plus the signed-in administrator.
    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({ page: 2, pageSize: 6, totalItems: 9, totalPages: 2 });
    expect(body.items).toHaveLength(3);
  });

  it('USR-04 defaults to 6 per page and validates page parameters', async () => {
    for (let i = 0; i < 7; i++) {
      await createUser();
    }

    expect((await listUsers()).body).toMatchObject({ page: 1, pageSize: 6 });
    expect((await listUsers()).body.items).toHaveLength(6);
    expect((await listUsers('?pageSize=100')).body.items).toHaveLength(8);
    for (const query of ['?page=0', '?page=abc', '?pageSize=101', '?pageSize=0']) {
      expect((await listUsers(query)).response.statusCode, query).toBe(400);
    }
  });

  it('USR-05 NFR-40 orders users newest first with a stable tie-breaker', async () => {
    const oldest = await createUser({ firstName: 'Oldest' });
    ctx.clock.advance(1000);
    const sameTimeA = await createUser({ firstName: 'Same A' });
    const sameTimeB = await createUser({ firstName: 'Same B' });
    ctx.clock.advance(1000);
    const newest = await createUser({ firstName: 'Newest' });

    const ids = (await listUsers()).body.items.map((user) => user.id);
    const tie = [sameTimeA.id, sameTimeB.id].sort().reverse();
    expect(ids).toEqual([newest.id, ...tie, oldest.id, ctx.admin.user.id]);
  });

  it('USR-06 returns an empty page beyond the last one', async () => {
    await createUser();
    expect((await listUsers('?page=5')).body).toEqual({
      items: [],
      page: 5,
      pageSize: 6,
      totalItems: 2,
      totalPages: 1,
    });
  });

  it('USR-07 updates first and last name', async () => {
    const user = await createUser();

    const response = await ctx.inject({
      method: 'PATCH',
      url: `/api/users/${user.id}`,
      payload: { firstName: 'Augusta', lastName: 'King' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ firstName: 'Augusta', lastName: 'King' });
  });

  it('USR-07 USR-08 requires both names and rejects status and read-only fields', async () => {
    const user = await createUser();

    for (const payload of [
      { status: 'inactive' },
      { firstName: 'Ada', lastName: 'King', createdAt: '2020-01-01T00:00:00.000Z' },
      { firstName: 'Ada', lastName: 'King', id: MISSING_ID },
      { firstName: 'Ada' },
      { lastName: 'King' },
      {},
    ]) {
      const response = await ctx.inject({
        method: 'PATCH',
        url: `/api/users/${user.id}`,
        payload,
      });
      expect(response.statusCode, JSON.stringify(payload)).toBe(400);
    }
  });

  it('USR-09 rejects name changes for inactive users', async () => {
    const user = await createUser({ status: 'inactive' });

    const response = await ctx.inject({
      method: 'PATCH',
      url: `/api/users/${user.id}`,
      payload: { firstName: 'Changed', lastName: 'Lovelace' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'USER_NAME_LOCKED' });
    const stored = (await listUsers()).body.items[0];
    expect(stored).toMatchObject({ firstName: 'Ada', updatedAt: user.updatedAt });
  });

  it('USR-10 sets the status, idempotently', async () => {
    const user = await createUser();

    for (const status of ['inactive', 'inactive', 'active']) {
      const response = await ctx.inject({
        method: 'PUT',
        url: `/api/users/${user.id}/status`,
        payload: { status },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status });
    }

    const invalid = await ctx.inject({
      method: 'PUT',
      url: `/api/users/${user.id}/status`,
      payload: { status: 'banned' },
    });
    expect(invalid.statusCode).toBe(400);
  });

  it('USR-11 deactivation terminates active sessions', async () => {
    const user = await createUser();
    const first = await signIn(user);
    const second = await signIn(user);

    await ctx.inject({
      method: 'PUT',
      url: `/api/users/${user.id}/status`,
      payload: { status: 'inactive' },
    });

    const rows = await ctx.database.pool.query<{ id: string; terminated_at: Date | null }>(
      'select id, terminated_at from sessions where user_id = $1',
      [user.id],
    );
    expect(rows.rows.map((row) => row.id).sort()).toEqual([first.id, second.id].sort());
    expect(rows.rows.every((row) => row.terminated_at !== null)).toBe(true);
  });

  it('USR-12 DATA-10 every update refreshes updatedAt and keeps createdAt', async () => {
    const user = await createUser();

    ctx.clock.advance(60_000);
    const renamed = await ctx.inject({
      method: 'PATCH',
      url: `/api/users/${user.id}`,
      payload: { firstName: 'Ada', lastName: 'Byron' },
    });
    expect(renamed.json()).toMatchObject({
      createdAt: user.createdAt,
      updatedAt: '2026-03-01T10:01:00.000Z',
    });

    ctx.clock.advance(60_000);
    const sameStatus = await ctx.inject({
      method: 'PUT',
      url: `/api/users/${user.id}/status`,
      payload: { status: 'active' },
    });
    expect(sameStatus.json()).toMatchObject({
      createdAt: user.createdAt,
      updatedAt: '2026-03-01T10:02:00.000Z',
    });
  });

  it('USR-13 DATA-12 deletes the user and their sessions', async () => {
    const user = await createUser();
    await signIn(user);

    const response = await ctx.inject({ method: 'DELETE', url: `/api/users/${user.id}` });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect((await listUsers()).body.items.map((u) => u.id)).toEqual([ctx.admin.user.id]);
    const sessions = await ctx.database.pool.query('select 1 from sessions where user_id = $1', [
      user.id,
    ]);
    expect(sessions.rowCount).toBe(0);
  });

  it('AUTH-30 nobody can deactivate or delete their own account', async () => {
    const self = ctx.admin.user.id;

    const deactivate = await ctx.inject({
      method: 'PUT',
      url: `/api/users/${self}/status`,
      payload: { status: 'inactive' },
    });
    const remove = await ctx.inject({ method: 'DELETE', url: `/api/users/${self}` });

    for (const response of [deactivate, remove]) {
      expect(response.statusCode).toBe(409);
      expect(response.json()).toMatchObject({ code: 'SELF_MODIFICATION_FORBIDDEN' });
    }
    const stillActive = await ctx.inject({
      method: 'PUT',
      url: `/api/users/${self}/status`,
      payload: { status: 'active' },
    });
    expect(stillActive.statusCode).toBe(200);
  });

  it('USR-14 answers 404 for unknown and 400 for malformed ids', async () => {
    const requests = [
      {
        method: 'PATCH' as const,
        url: '/api/users/ID',
        payload: { firstName: 'X', lastName: 'Y' },
      },
      { method: 'PUT' as const, url: '/api/users/ID/status', payload: { status: 'active' } },
      { method: 'DELETE' as const, url: '/api/users/ID' },
    ];

    for (const request of requests) {
      const missing = await ctx.inject({
        ...request,
        url: request.url.replace('ID', MISSING_ID),
      });
      expect(missing.statusCode, request.method).toBe(404);
      expect(missing.json()).toMatchObject({ code: 'USER_NOT_FOUND' });

      const malformed = await ctx.inject({ ...request, url: request.url.replace('ID', 'abc') });
      expect(malformed.statusCode, request.method).toBe(400);
    }
  });
});
