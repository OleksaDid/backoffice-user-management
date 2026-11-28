import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../errors/app-error.js';
import type { Authenticated, AuthService } from '../services/auth-service.js';
import { SESSION_COOKIE } from './session-cookie.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by `requireAuth` on protected routes. */
    auth: Authenticated | null;
  }
}

/** The authenticated user and session of a protected route (set by requireAuth). */
export function authOf(request: FastifyRequest): Authenticated {
  if (!request.auth) {
    throw new Error('authOf() used on a route without requireAuth');
  }
  return request.auth;
}

/** AUTH-08: onRequest hook (runs before body parsing) that rejects requests without an active session with 401. */
export function requireAuth(auth: AuthService) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    request.auth = await auth.authenticate(request.cookies[SESSION_COOKIE]);
    if (!request.auth) {
      throw new AppError('UNAUTHENTICATED');
    }
  };
}
