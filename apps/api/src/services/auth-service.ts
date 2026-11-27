import type { SignInBody, SignUpBody } from '@backoffice/contracts';

import type { SessionEntity } from '../domain/session.js';
import type { UserEntity } from '../domain/user.js';
import { AppError } from '../errors/app-error.js';
import type { UnitOfWork } from '../repositories/unit-of-work.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { Clock } from './clock.js';
import { startSession } from './session-service.js';
import { createUserOrConflict } from './user-service.js';

export interface Authenticated {
  user: UserEntity;
  session: SessionEntity;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Authentication use cases (spec 02). */
export class AuthService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly hasher: PasswordHasher,
    private readonly ttlHours: number,
  ) {}

  /** AUTH-01, AUTH-02: user, credentials and the first session in one transaction. */
  async signUp(body: SignUpBody): Promise<Authenticated> {
    const passwordHash = await this.hasher.hash(body.password);
    return this.uow.transaction(async (repositories) => {
      const now = this.clock();
      const created = await createUserOrConflict(
        repositories.users,
        { firstName: body.firstName, lastName: body.lastName, email: body.email, status: 'active' },
        now,
      );
      await repositories.credentials.setPassword(created.id, passwordHash, now);
      const session = await startSession(repositories, created.id, now, this.ttlHours);
      return { user: await this.reload(repositories.users, created.id), session };
    });
  }

  /**
   * AUTH-03 to AUTH-05: unknown email and wrong password are indistinguishable (same
   * error, comparable time); the inactive status is revealed only after the password
   * was verified.
   */
  async signIn(body: SignInBody): Promise<Authenticated> {
    const { users, credentials } = this.uow.repositories;
    const user = await users.findByEmail(body.email);
    const hash = user ? await credentials.passwordHashOf(user.id) : undefined;
    const valid =
      user && hash
        ? await this.hasher.verify(body.password, hash)
        : await this.hasher.verifyAgainstDummy(body.password);
    if (!user || !valid) {
      throw new AppError('INVALID_CREDENTIALS');
    }
    try {
      return await this.uow.transaction(async (repositories) => {
        const session = await startSession(repositories, user.id, this.clock(), this.ttlHours);
        return { user: await this.reload(repositories.users, user.id), session };
      });
    } catch (error) {
      // Deleted between the password check and the session: sign-in never answers 404.
      if (error instanceof AppError && error.code === 'USER_NOT_FOUND') {
        throw new AppError('INVALID_CREDENTIALS', { cause: error });
      }
      throw error;
    }
  }

  /** AUTH-06: ends the given session if it is still active; no error otherwise. */
  async signOut(sessionId: string | undefined): Promise<void> {
    if (sessionId && UUID.test(sessionId)) {
      await this.uow.repositories.sessions.terminateIfActive(sessionId, this.clock());
    }
  }

  /** AUTH-07, AUTH-08: the user behind an active session, or null. */
  async authenticate(sessionId: string | undefined): Promise<Authenticated | null> {
    if (!sessionId || !UUID.test(sessionId)) {
      return null;
    }
    // Deactivation ends sessions (USR-11); requiring an active user keeps this safe anyway.
    const found = await this.uow.repositories.sessions.findActiveWithUser(sessionId, this.clock());
    return found ?? null;
  }

  private async reload(
    users: UnitOfWork['repositories']['users'],
    id: string,
  ): Promise<UserEntity> {
    const user = await users.findById(id);
    if (!user) {
      throw new Error('User vanished inside its own transaction');
    }
    return user;
  }
}
