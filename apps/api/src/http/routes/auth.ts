import {
  authResponseSchema,
  problemDetailsSchema,
  signInBodySchema,
  signUpBodySchema,
} from '@backoffice/contracts';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Clock } from '../../services/clock.js';
import type { AuthService, Authenticated } from '../../services/auth-service.js';
import { authOf, requireAuth } from '../auth.js';
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
  (auth: AuthService, cookies: CookieSettings, clock: Clock): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    app.post(
      '/auth/sign-up',
      {
        schema: {
          tags,
          summary: 'Register, sign in and receive the session cookie',
          body: signUpBodySchema,
          response: { 201: authResponseSchema, 400: problem, 409: problem },
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
        schema: {
          tags,
          summary: 'Sign in and receive the session cookie',
          body: signInBodySchema,
          response: { 200: authResponseSchema, 400: problem, 401: problem, 403: problem },
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
        preValidation: requireAuth(auth),
        schema: {
          tags,
          summary: 'The signed-in user and their session',
          response: { 200: authResponseSchema, 401: problem },
        },
      },
      (request) => toAuthResponse(authOf(request)),
    );

    done();
  };
