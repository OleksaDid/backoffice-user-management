import type { Paginated, Session, User } from '@backoffice/contracts';
import { describe, expect, it } from 'vitest';

import { useIntegrationApp } from '../support/integration.js';

const ctx = useIntegrationApp();
const MISSING_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

async function createUser(body: Record<string, unknown> = {}): Promise<User> {
  const response = await ctx.app.inject({
    method: 'POST',
    url: '/api/users',
    payload: { firstName: 'Ada', lastName: 'Lovelace', ...body },
  });
  expect(response.statusCode).toBe(201);
  return response.json<User>();
}

async function createSession(userId: string): Promise<Session> {
  const response = await ctx.app.inject({
    method: 'POST',
    url: '/api/sessions',
    payload: { userId },
  });
  expect(response.statusCode).toBe(201);
  return response.json<Session>();
}

async function listUsers(query = '') {
  const response = await ctx.app.inject({ url: `/api/users${query}` });
  return { response, body: response.json<Paginated<User>>() };
}

describe('users API (integration)', () => {
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

  it('USR-02 rejects unknown and read-only fields', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { firstName: 'Ada', lastName: '', loginsCount: 5, createdAt: '2020-01-01' },
    });

    expect(response.statusCode).toBe(400);
    const paths = response
      .json<{ errors: { path: string }[] }>()
      .errors.map((error) => error.path)
      .sort();
    expect(paths).toEqual(['createdAt', 'lastName', 'loginsCount']);
  });

  it('USR-03 returns a page with totals', async () => {
    for (let i = 0; i < 8; i++) {
      await createUser({ firstName: `User${i}` });
      ctx.clock.advance(1000);
    }

    const { response, body } = await listUsers('?page=2');

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({ page: 2, pageSize: 6, totalItems: 8, totalPages: 2 });
    expect(body.items).toHaveLength(2);
  });

  it('USR-04 defaults to 6 per page and validates page parameters', async () => {
    for (let i = 0; i < 7; i++) {
      await createUser();
    }

    expect((await listUsers()).body).toMatchObject({ page: 1, pageSize: 6 });
    expect((await listUsers()).body.items).toHaveLength(6);
    expect((await listUsers('?pageSize=100')).body.items).toHaveLength(7);
    for (const query of ['?page=0', '?page=abc', '?pageSize=101', '?pageSize=0']) {
      expect((await listUsers(query)).response.statusCode, query).toBe(400);
    }
  });

  it('USR-05 orders users newest first with a stable tie-breaker', async () => {
    const oldest = await createUser({ firstName: 'Oldest' });
    ctx.clock.advance(1000);
    const sameTimeA = await createUser({ firstName: 'Same A' });
    const sameTimeB = await createUser({ firstName: 'Same B' });
    ctx.clock.advance(1000);
    const newest = await createUser({ firstName: 'Newest' });

    const ids = (await listUsers()).body.items.map((user) => user.id);
    const tie = [sameTimeA.id, sameTimeB.id].sort().reverse();
    expect(ids).toEqual([newest.id, ...tie, oldest.id]);
  });

  it('USR-06 returns an empty page beyond the last one', async () => {
    expect((await listUsers()).body).toEqual({
      items: [],
      page: 1,
      pageSize: 6,
      totalItems: 0,
      totalPages: 0,
    });

    await createUser();
    expect((await listUsers('?page=5')).body).toMatchObject({
      items: [],
      page: 5,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('USR-07 updates first and last name', async () => {
    const user = await createUser();

    const response = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/users/${user.id}`,
      payload: { firstName: 'Augusta', lastName: 'King' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ firstName: 'Augusta', lastName: 'King' });
  });

  it('USR-08 rejects status and read-only fields in profile updates', async () => {
    const user = await createUser();

    for (const payload of [
      { status: 'inactive' },
      { firstName: 'Ada', createdAt: '2020-01-01T00:00:00.000Z' },
      { firstName: 'Ada', id: MISSING_ID },
      {},
    ]) {
      const response = await ctx.app.inject({
        method: 'PATCH',
        url: `/api/users/${user.id}`,
        payload,
      });
      expect(response.statusCode, JSON.stringify(payload)).toBe(400);
    }
  });

  it('USR-09 rejects name changes for inactive users', async () => {
    const user = await createUser({ status: 'inactive' });

    const response = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/users/${user.id}`,
      payload: { firstName: 'Changed' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'USER_NAME_LOCKED' });
    const stored = (await listUsers()).body.items[0];
    expect(stored).toMatchObject({ firstName: 'Ada', updatedAt: user.updatedAt });
  });

  it('USR-10 sets the status, idempotently', async () => {
    const user = await createUser();

    for (const status of ['inactive', 'inactive', 'active']) {
      const response = await ctx.app.inject({
        method: 'PUT',
        url: `/api/users/${user.id}/status`,
        payload: { status },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status });
    }

    const invalid = await ctx.app.inject({
      method: 'PUT',
      url: `/api/users/${user.id}/status`,
      payload: { status: 'banned' },
    });
    expect(invalid.statusCode).toBe(400);
  });

  it('USR-11 deactivation terminates active sessions', async () => {
    const user = await createUser();
    const first = await createSession(user.id);
    const second = await createSession(user.id);

    await ctx.app.inject({
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

  it('USR-12 every update refreshes updatedAt and keeps createdAt', async () => {
    const user = await createUser();

    ctx.clock.advance(60_000);
    const renamed = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/users/${user.id}`,
      payload: { lastName: 'Byron' },
    });
    expect(renamed.json()).toMatchObject({
      createdAt: user.createdAt,
      updatedAt: '2026-03-01T10:01:00.000Z',
    });

    ctx.clock.advance(60_000);
    const sameStatus = await ctx.app.inject({
      method: 'PUT',
      url: `/api/users/${user.id}/status`,
      payload: { status: 'active' },
    });
    expect(sameStatus.json()).toMatchObject({
      createdAt: user.createdAt,
      updatedAt: '2026-03-01T10:02:00.000Z',
    });
  });

  it('USR-13 deletes the user and their sessions', async () => {
    const user = await createUser();
    await createSession(user.id);

    const response = await ctx.app.inject({ method: 'DELETE', url: `/api/users/${user.id}` });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect((await listUsers()).body.totalItems).toBe(0);
    const sessions = await ctx.database.pool.query('select 1 from sessions where user_id = $1', [
      user.id,
    ]);
    expect(sessions.rowCount).toBe(0);
  });

  it('USR-14 answers 404 for unknown and 400 for malformed ids', async () => {
    const requests = [
      { method: 'PATCH' as const, url: '/api/users/ID', payload: { firstName: 'X' } },
      { method: 'PUT' as const, url: '/api/users/ID/status', payload: { status: 'active' } },
      { method: 'DELETE' as const, url: '/api/users/ID' },
    ];

    for (const request of requests) {
      const missing = await ctx.app.inject({
        ...request,
        url: request.url.replace('ID', MISSING_ID),
      });
      expect(missing.statusCode, request.method).toBe(404);
      expect(missing.json()).toMatchObject({ code: 'USER_NOT_FOUND' });

      const malformed = await ctx.app.inject({ ...request, url: request.url.replace('ID', 'abc') });
      expect(malformed.statusCode, request.method).toBe(400);
    }
  });
});
