import { and, eq, gt, isNull } from 'drizzle-orm';

import { sessions, users } from '../db/schema.js';
import type { SessionEntity } from '../domain/session.js';
import type { UserEntity } from '../domain/user.js';
import type { Executor } from './executor.js';

export class SessionRepository {
  constructor(private readonly db: Executor) {}

  async create(session: { userId: string; expiresAt: Date }, now: Date): Promise<SessionEntity> {
    const [row] = await this.db
      .insert(sessions)
      .values({ ...session, createdAt: now })
      .returning();
    if (!row) {
      throw new Error('Insert into sessions returned no row');
    }
    return row;
  }

  async findById(id: string): Promise<SessionEntity | undefined> {
    const [row] = await this.db.select().from(sessions).where(eq(sessions.id, id));
    return row;
  }

  /**
   * AUTH-08: the active session with its active user, in one indexed query; this runs on
   * every authenticated request.
   */
  async findActiveWithUser(
    id: string,
    now: Date,
  ): Promise<{ session: SessionEntity; user: UserEntity } | undefined> {
    const [row] = await this.db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.id, id),
          isNull(sessions.terminatedAt),
          gt(sessions.expiresAt, now),
          eq(users.status, 'active'),
        ),
      );
    return row;
  }

  /** Terminates the session if it is still active; returns undefined otherwise. */
  async terminateIfActive(id: string, now: Date): Promise<SessionEntity | undefined> {
    const [row] = await this.db
      .update(sessions)
      .set({ terminatedAt: now })
      .where(and(eq(sessions.id, id), isNull(sessions.terminatedAt), gt(sessions.expiresAt, now)))
      .returning();
    return row;
  }

  /** USR-11: uses the partial index on active sessions per user. */
  async terminateActiveForUser(userId: string, now: Date): Promise<number> {
    const rows = await this.db
      .update(sessions)
      .set({ terminatedAt: now })
      // Only active sessions: expired ones keep their record unchanged (SES-05).
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.terminatedAt),
          gt(sessions.expiresAt, now),
        ),
      )
      .returning({ id: sessions.id });
    return rows.length;
  }
}
