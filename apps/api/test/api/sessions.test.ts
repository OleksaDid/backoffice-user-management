import type { AuthResponse, Paginated, User } from '@backoffice/contracts';
import { describe, expect, it } from 'vitest';

import { uniqueEmail, useIntegrationApp } from '../support/integration.js';

const ctx = useIntegrationApp({ sessionTtlHours: 24 });
const MISSING_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const PASSWORD = 'correct horse';

async function createUser(status: 'active' | 'inactive' = 'active'): Promise<User> {
  const response = await ctx.inject({
    method: 'POST',
    url: '/api/users',
    payload: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: uniqueEmail(),
      password: PASSWORD,
      status,
    },
  });
  return response.json<User>();
}

/** Since AUTH-09, sessions are created by signing in. */
function signIn(user: User) {
  return ctx.app.inject({
    method: 'POST',
    url: '/api/auth/sign-in',
    payload: { email: user.email, password: PASSWORD },
  });
}

async function sessionOf(user: User) {
  return (await signIn(user)).json<AuthResponse>().session;
}

function terminate(id: string) {
  return ctx.inject({ method: 'DELETE', url: `/api/sessions/${id}` });
}

async function userById(id: string): Promise<User> {
  const response = await ctx.inject({ url: '/api/users?pageSize=100' });
  const user = response.json<Paginated<User>>().items.find((item) => item.id === id);
  if (!user) {
    throw new Error(`user ${id} not found`);
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
  it('SES-01 an active user gets a session with the configured lifetime', async () => {
    const user = await createUser();

    const response = await signIn(user);

    expect(response.statusCode).toBe(200);
    expect(response.json<AuthResponse>().session).toMatchObject({
      userId: user.id,
      createdAt: '2026-03-01T10:00:00.000Z',
      expiresAt: '2026-03-02T10:00:00.000Z',
      terminatedAt: null,
    });
  });

  it('SES-02 inactive users cannot create sessions and are not counted', async () => {
    const inactive = await createUser('inactive');

    const rejected = await signIn(inactive);

    expect(rejected.statusCode).toBe(403);
    expect(rejected.json()).toMatchObject({ code: 'USER_INACTIVE' });
    expect((await userById(inactive.id)).loginsCount).toBe(0);
  });

  it('SES-03 DATA-11 increments loginsCount atomically and never decreases it', async () => {
    const user = await createUser();
    ctx.clock.advance(5_000);

    const responses = await Promise.all(Array.from({ length: 10 }, () => signIn(user)));
    expect(responses.every((response) => response.statusCode === 200)).toBe(true);

    const counted = await userById(user.id);
    expect(counted.loginsCount).toBe(10);
    expect(counted.updatedAt).toBe('2026-03-01T10:00:05.000Z');

    const [first] = responses;
    await terminate(first?.json<AuthResponse>().session.id ?? '');
    expect((await userById(user.id)).loginsCount).toBe(10);
  });

  it('SES-04 terminates a session and keeps the record', async () => {
    const session = await sessionOf(await createUser());
    ctx.clock.advance(60_000);

    const response = await terminate(session.id);

    expect(response.statusCode).toBe(204);
    expect((await terminatedAt(session.id))?.toISOString()).toBe('2026-03-01T10:01:00.000Z');
  });

  it('SES-05 terminating again is idempotent', async () => {
    const session = await sessionOf(await createUser());
    await terminate(session.id);
    const first = await terminatedAt(session.id);

    ctx.clock.advance(60_000);
    const again = await terminate(session.id);

    expect(again.statusCode).toBe(204);
    expect(await terminatedAt(session.id)).toEqual(first);
  });

  it('SES-05 terminating an expired session changes nothing', async () => {
    const session = await sessionOf(await createUser());
    ctx.clock.advance(25 * 60 * 60 * 1000);
    // The administrator's own session has expired too; sign in again.
    const admin = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: 'admin@example.com', password: 'admin password' },
    });
    const sid = admin.json<AuthResponse>().session.id;

    const response = await ctx.app.inject({
      method: 'DELETE',
      url: `/api/sessions/${session.id}`,
      cookies: { sid },
    });

    expect(response.statusCode).toBe(204);
    expect(await terminatedAt(session.id)).toBeNull();
  });

  it('SES-06 answers 404 for unknown sessions', async () => {
    const response = await terminate(MISSING_ID);
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'SESSION_NOT_FOUND' });
    expect((await terminate('not-a-uuid')).statusCode).toBe(400);
  });

  it('AUTH-08 terminating a session requires a session', async () => {
    const response = await ctx.app.inject({ method: 'DELETE', url: `/api/sessions/${MISSING_ID}` });
    expect(response.statusCode).toBe(401);
  });

  it('AUTH-09 sessions can no longer be created for an arbitrary user id', async () => {
    const user = await createUser();
    const response = await ctx.inject({
      method: 'POST',
      url: '/api/sessions',
      payload: { userId: user.id },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'ROUTE_NOT_FOUND' });
  });

  it('AUTH-09 ending your own current session works like signing out', async () => {
    const response = await terminate(ctx.admin.session.id);

    expect(response.statusCode).toBe(204);
    expect(response.cookies.find((c) => c.name === 'sid')?.value).toBe('');
    expect((await ctx.inject({ url: '/api/auth/me' })).statusCode).toBe(401);
  });
});
