import { type SessionEntity, sessionExpiry } from '../domain/session.js';
import { assertCanStartSession } from '../domain/user.js';
import { AppError } from '../errors/app-error.js';
import type { UnitOfWork } from '../repositories/unit-of-work.js';
import type { Clock } from './clock.js';

/** Use cases of the sessions API (spec 01). */
export class SessionService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ttlHours: number,
  ) {}

  /** SES-01 to SES-03: check, create and count in one transaction on the locked user. */
  create(userId: string): Promise<SessionEntity> {
    return this.uow.transaction(async ({ users, sessions }) => {
      const user = await users.findByIdForUpdate(userId);
      if (!user) {
        throw new AppError('USER_NOT_FOUND');
      }
      assertCanStartSession(user);
      const now = this.clock();
      const session = await sessions.create(
        { userId, expiresAt: sessionExpiry(now, this.ttlHours) },
        now,
      );
      await users.incrementLogins(userId, now);
      return session;
    });
  }

  /** SES-04 to SES-06: terminating an ended session is a no-op, an unknown one is 404. */
  async terminate(id: string): Promise<void> {
    const { sessions } = this.uow.repositories;
    if (await sessions.terminateIfActive(id, this.clock())) {
      return;
    }
    if (!(await sessions.findById(id))) {
      throw new AppError('SESSION_NOT_FOUND');
    }
  }
}
