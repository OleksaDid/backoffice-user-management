/** A session as the domain sees it. */
export interface SessionEntity {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  terminatedAt: Date | null;
}

const HOUR_MS = 60 * 60 * 1000;

/** Absolute expiry: creation time plus the configured lifetime (spec 01, Session). */
export function sessionExpiry(now: Date, ttlHours: number): Date {
  return new Date(now.getTime() + ttlHours * HOUR_MS);
}

/** A session is active when it was not terminated and has not expired. */
export function isSessionActive(session: SessionEntity, now: Date): boolean {
  return session.terminatedAt === null && session.expiresAt.getTime() > now.getTime();
}
