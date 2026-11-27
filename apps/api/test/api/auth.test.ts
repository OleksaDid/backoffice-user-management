import type { AuthResponse } from '@backoffice/contracts';
import { describe, expect, it, vi } from 'vitest';

import { useIntegrationApp } from '../support/integration.js';

const ctx = useIntegrationApp({ sessionTtlHours: 24 });

const ada = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  password: 'correct horse',
};

function signUp(body: Record<string, unknown> = ada) {
  return ctx.app.inject({ method: 'POST', url: '/api/auth/sign-up', payload: body });
}

function signIn(email = ada.email, password = ada.password) {
  return ctx.app.inject({
    method: 'POST',
    url: '/api/auth/sign-in',
    payload: { email, password },
  });
}

function sessionCookie(response: { cookies: { name: string; value: string }[] }): string {
  const cookie = response.cookies.find((c) => c.name === 'sid');
  if (!cookie) {
    throw new Error('no session cookie');
  }
  return cookie.value;
}

function me(sid?: string) {
  return ctx.app.inject({ url: '/api/auth/me', ...(sid ? { cookies: { sid } } : {}) });
}

describe('authentication API (integration)', () => {
  it('AUTH-01 sign-up creates an active user with one login and starts a session', async () => {
    const response = await signUp();

    expect(response.statusCode).toBe(201);
    const body = response.json<AuthResponse>();
    expect(body.user).toMatchObject({
      email: 'ada@example.com',
      status: 'active',
      loginsCount: 1,
    });
    expect(body.session).toMatchObject({ userId: body.user.id, terminatedAt: null });
    expect(sessionCookie(response)).toBe(body.session.id);
  });

  it('AUTH-02 rejects a duplicate email at sign-up and creates nothing', async () => {
    await signUp();
    const response = await signUp({ ...ada, email: 'ADA@example.com', firstName: 'Other' });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ code: 'EMAIL_ALREADY_REGISTERED' });
    expect(response.cookies).toHaveLength(0);
  });

  it('AUTH-03 sign-in starts a session and counts the login', async () => {
    await signUp();

    const response = await signIn('Ada@Example.com');

    expect(response.statusCode).toBe(200);
    const body = response.json<AuthResponse>();
    expect(body.user.loginsCount).toBe(2);
    expect(sessionCookie(response)).toBe(body.session.id);
  });

  it('AUTH-04 unknown email and wrong password get the same answer', async () => {
    await signUp();

    const wrongPassword = await signIn(ada.email, 'wrong password');
    const unknownEmail = await signIn('nobody@example.com', 'wrong password');

    for (const response of [wrongPassword, unknownEmail]) {
      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        detail: 'Invalid email or password.',
      });
    }
  });

  it('AUTH-05 an inactive user with the right password is told the account is inactive', async () => {
    const { user } = (await signUp()).json<AuthResponse>();
    await ctx.database.pool.query("update users set status = 'inactive' where id = $1", [user.id]);

    expect((await signIn(ada.email, 'wrong password')).statusCode).toBe(401);
    const response = await signIn();
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'USER_INACTIVE' });
  });

  it('AUTH-04 a user deleted during sign-in gets 401, never 404', async () => {
    const { user } = (await signUp()).json<AuthResponse>();
    // Simulate the race: the row disappears after the password check.
    const original = ctx.database.db.transaction.bind(ctx.database.db);
    const spy = vi.spyOn(ctx.database.db, 'transaction').mockImplementationOnce(async (work) => {
      await ctx.database.pool.query('delete from users where id = $1', [user.id]);
      return original(work);
    });

    const response = await signIn();

    spy.mockRestore();
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('AUTH-08 a session of a user who is no longer active does not authenticate', async () => {
    const sid = sessionCookie(await signUp());
    await ctx.database.pool.query("update users set status = 'inactive'");
    expect((await me(sid)).statusCode).toBe(401);
  });

  it('AUTH-06 sign-out ends the session and clears the cookie, even without a session', async () => {
    const sid = sessionCookie(await signUp());

    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      cookies: { sid },
    });
    expect(response.statusCode).toBe(204);
    const cleared = response.cookies.find((c) => c.name === 'sid');
    expect(cleared?.value).toBe('');
    expect((await me(sid)).statusCode).toBe(401);

    const anonymous = await ctx.app.inject({ method: 'POST', url: '/api/auth/sign-out' });
    expect(anonymous.statusCode).toBe(204);
  });

  it('AUTH-07 me returns the signed-in user and session', async () => {
    const signedUp = (await signUp()).json<AuthResponse>();

    const response = await me(signedUp.session.id);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(signedUp);
  });

  it('AUTH-08 me without, with an unknown, a malformed or an expired session is 401', async () => {
    const sid = sessionCookie(await signUp());

    for (const value of [undefined, '7c9e6679-7425-40de-944b-e07fc1f90ae7', 'garbage']) {
      const response = await me(value);
      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
    }

    ctx.clock.advance(24 * 60 * 60 * 1000);
    expect((await me(sid)).statusCode).toBe(401);
  });

  it('AUTH-20 the cookie is httpOnly, Secure, SameSite=Strict, API-scoped and lives as long as the session', async () => {
    const response = await signUp();
    const cookie = response.cookies.find((c) => c.name === 'sid');

    expect(cookie).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/api',
      maxAge: 24 * 60 * 60,
    });
  });

  it('AUTH-22 the response body carries the session id that the cookie holds', async () => {
    await signUp();
    const response = await signIn();
    expect(response.json<AuthResponse>().session.id).toBe(sessionCookie(response));
  });

  it('AUTH-23 signing in on another device keeps the first session; signing out ends only one', async () => {
    const laptop = sessionCookie(await signUp());
    const phone = sessionCookie(await signIn());
    expect(phone).not.toBe(laptop);

    expect((await me(laptop)).statusCode).toBe(200);
    expect((await me(phone)).statusCode).toBe(200);

    await ctx.app.inject({ method: 'POST', url: '/api/auth/sign-out', cookies: { sid: phone } });
    expect((await me(phone)).statusCode).toBe(401);
    expect((await me(laptop)).statusCode).toBe(200);
  });
});
