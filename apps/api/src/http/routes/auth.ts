import {
  authResponseSchema,
  meResponseSchema,
  problemDetailsSchema,
  signInBodySchema,
  signUpBodySchema,
} from '@backoffice/contracts';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Clock } from '../../services/clock.js';
import type { AuthService, Authenticated } from '../../services/auth-service.js';
import { toSessionDto, toUserDto } from '../mappers.js';
import {
  clearSessionCookie,
  type CookieSettings,
  SESSION_COOKIE,
  setSessionCookie,
} from '../session-cookie.js';

const problem = problemDetailsSchema;
const tags = ['auth'];

function toAuthResponse({ user, session }: Authenticated) {
  return { user: toUserDto(user), session: toSessionDto(session) };
}

/** Authentication API (spec 02). */
export const authRoutes =
  (
    auth: AuthService,
    cookies: CookieSettings,
    clock: Clock,
    attemptsPerMinute: number,
  ): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    // AUTH-40: brute-force and sign-up spam protection per client IP.
    const rateLimit = { max: attemptsPerMinute, timeWindow: '1 minute' };

    app.post(
      '/auth/sign-up',
      {
        config: { rateLimit },
        schema: {
          tags,
          summary: 'Register, sign in and receive the session cookie',
          body: signUpBodySchema,
          response: { 201: authResponseSchema, 400: problem, 409: problem, 429: problem },
        },
      },
      async (request, reply) => {
        const result = await auth.signUp(request.body);
        setSessionCookie(reply, result.session, cookies, clock());
        return reply.status(201).send(toAuthResponse(result));
      },
    );

    app.post(
      '/auth/sign-in',
      {
        config: { rateLimit },
        schema: {
          tags,
          summary: 'Sign in and receive the session cookie',
          body: signInBodySchema,
          response: {
            200: authResponseSchema,
            400: problem,
            401: problem,
            403: problem,
            429: problem,
          },
        },
      },
      async (request, reply) => {
        const result = await auth.signIn(request.body);
        setSessionCookie(reply, result.session, cookies, clock());
        return toAuthResponse(result);
      },
    );

    app.post(
      '/auth/sign-out',
      {
        schema: {
          tags,
          summary: 'End the current session and clear the cookie (always succeeds)',
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        await auth.signOut(request.cookies[SESSION_COOKIE]);
        clearSessionCookie(reply, cookies);
        return reply.status(204).send(null);
      },
    );

    app.get(
      '/auth/me',
      {
        schema: {
          tags,
          summary: 'The signed-in user and their session, or nulls when nobody is signed in',
          response: { 200: meResponseSchema },
        },
      },
      async (request, reply) => {
        const sid = request.cookies[SESSION_COOKIE];
        const current = await auth.authenticate(sid);
        if (!current) {
          // A cookie that no longer opens a session is cleared, so the browser stops sending it.
          if (sid !== undefined) {
            clearSessionCookie(reply, cookies);
          }
          return { user: null, session: null };
        }
        const { id: _credential, ...currentSession } = toSessionDto(current.session);
        return { user: toUserDto(current.user), session: currentSession };
      },
    );

    done();
  };
