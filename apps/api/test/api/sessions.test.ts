import type { Paginated, Session, User } from '@backoffice/contracts';
import { describe, expect, it } from 'vitest';

import { useIntegrationApp } from '../support/integration.js';

const ctx = useIntegrationApp({ sessionTtlHours: 24 });
const MISSING_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

async function createUser(status: 'active' | 'inactive' = 'active'): Promise<User> {
  const response = await ctx.app.inject({
    method: 'POST',
    url: '/api/users',
    payload: { firstName: 'Ada', lastName: 'Lovelace', status },
  });
  return response.json<User>();
}

function createSession(userId: string) {
  return ctx.app.inject({ method: 'POST', url: '/api/sessions', payload: { userId } });
}

function terminate(id: string) {
  return ctx.app.inject({ method: 'DELETE', url: `/api/sessions/${id}` });
}

async function currentUser(): Promise<User> {
  const response = await ctx.app.inject({ url: '/api/users' });
  const [user] = response.json<Paginated<User>>().items;
  if (!user) {
    throw new Error('expected one user');
  }
  return user;
}

async function terminatedAt(id: string): Promise<Date | null> {
  const result = await ctx.database.pool.query<{ terminated_at: Date | null }>(
    'select terminated_at from sessions where id = $1',
    [id],
  );
  return result.rows[0]?.terminated_at ?? null;
}

describe('sessions API (integration)', () => {
  it('SES-01 creates a session for an active user', async () => {
    const user = await createUser();

    const response = await createSession(user.id);

    expect(response.statusCode).toBe(201);
    expect(response.json<Session>()).toMatchObject({
      userId: user.id,
      createdAt: '2026-03-01T10:00:00.000Z',
      expiresAt: '2026-03-02T10:00:00.000Z',
      terminatedAt: null,
    });
  });

  it('SES-02 rejects inactive and unknown users', async () => {
    const inactive = await createUser('inactive');

    const rejected = await createSession(inactive.id);
    expect(rejected.statusCode).toBe(403);
    expect(rejected.json()).toMatchObject({ code: 'USER_INACTIVE' });
    expect((await currentUser()).loginsCount).toBe(0);

    const unknown = await createSession(MISSING_ID);
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json()).toMatchObject({ code: 'USER_NOT_FOUND' });
  });

  it('SES-03 increments loginsCount atomically and never decreases it', async () => {
    const user = await createUser();
    ctx.clock.advance(5_000);

    const responses = await Promise.all(Array.from({ length: 10 }, () => createSession(user.id)));
    expect(responses.every((response) => response.statusCode === 201)).toBe(true);

    const counted = await currentUser();
    expect(counted.loginsCount).toBe(10);
    expect(counted.updatedAt).toBe('2026-03-01T10:00:05.000Z');

    const [first] = responses;
    await terminate(first?.json<Session>().id ?? '');
    expect((await currentUser()).loginsCount).toBe(10);
  });

  it('SES-04 terminates a session and keeps the record', async () => {
    const user = await createUser();
    const session = (await createSession(user.id)).json<Session>();
    ctx.clock.advance(60_000);

    const response = await terminate(session.id);

    expect(response.statusCode).toBe(204);
    expect((await terminatedAt(session.id))?.toISOString()).toBe('2026-03-01T10:01:00.000Z');
  });

  it('SES-05 terminating again is idempotent', async () => {
    const user = await createUser();
    const session = (await createSession(user.id)).json<Session>();
    await terminate(session.id);
    const first = await terminatedAt(session.id);

    ctx.clock.advance(60_000);
    const again = await terminate(session.id);

    expect(again.statusCode).toBe(204);
    expect(await terminatedAt(session.id)).toEqual(first);
  });

  it('SES-05 terminating an expired session changes nothing', async () => {
    const user = await createUser();
    const session = (await createSession(user.id)).json<Session>();
    ctx.clock.advance(25 * 60 * 60 * 1000);

    expect((await terminate(session.id)).statusCode).toBe(204);
    expect(await terminatedAt(session.id)).toBeNull();
  });

  it('SES-06 answers 404 for unknown sessions', async () => {
    const response = await terminate(MISSING_ID);
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'SESSION_NOT_FOUND' });
    expect((await terminate('not-a-uuid')).statusCode).toBe(400);
  });
});
