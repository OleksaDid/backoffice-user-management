import type { FastifyReply } from 'fastify';

import type { SessionEntity } from '../domain/session.js';

export const SESSION_COOKIE = 'sid';

export interface CookieSettings {
  secure: boolean;
}

/**
 * AUTH-20: the session id travels only in an httpOnly, SameSite=Strict cookie scoped to
 * the API, living exactly as long as the session.
 */
export function setSessionCookie(
  reply: FastifyReply,
  session: SessionEntity,
  settings: CookieSettings,
  now: Date,
): void {
  const maxAge = Math.max(0, Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000));
  reply.setCookie(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: settings.secure,
    sameSite: 'strict',
    path: '/api',
    maxAge,
  });
}

export function clearSessionCookie(reply: FastifyReply, settings: CookieSettings): void {
  reply.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: settings.secure,
    sameSite: 'strict',
    path: '/api',
  });
}
