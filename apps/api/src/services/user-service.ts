import {
  type CreateUserBody,
  type Paginated,
  type PaginationQuery,
  totalPages,
  type UpdateUserProfileBody,
  type UserStatus,
} from '@backoffice/contracts';

import {
  assertNotSelf,
  endsSessions,
  profileChanges,
  statusChanges,
  type UserEntity,
} from '../domain/user.js';
import { AppError } from '../errors/app-error.js';
import { isUniqueViolation } from '../repositories/errors.js';
import type { UnitOfWork } from '../repositories/unit-of-work.js';
import { EMAIL_UNIQUE_CONSTRAINT } from '../repositories/user-repository.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { Clock } from './clock.js';

/** Use cases of the users API (spec 01). */
export class UserService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly hasher: PasswordHasher,
  ) {}

  /** USR-01, AUTH-12: the user and their credentials are created together or not at all. */
  async create(body: CreateUserBody): Promise<UserEntity> {
    // Hash outside the transaction: it is slow and needs no database locks.
    const passwordHash = await this.hasher.hash(body.password);
    return this.uow.transaction(async ({ users, credentials }) => {
      const now = this.clock();
      const user = await createUserOrConflict(
        users,
        {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          status: body.status ?? 'active',
        },
        now,
      );
      await credentials.setPassword(user.id, passwordHash, now);
      return user;
    });
  }

  /** USR-03 to USR-06 */
  async list(query: PaginationQuery): Promise<Paginated<UserEntity>> {
    const { items, total } = await this.uow.repositories.users.page({
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      totalItems: total,
      totalPages: totalPages(total, query.pageSize),
    };
  }

  /** USR-07, USR-09, USR-12 */
  updateProfile(id: string, patch: UpdateUserProfileBody): Promise<UserEntity> {
    return this.uow.transaction(async ({ users }) => {
      const user = await this.lockedUser(users, id);
      const changes = profileChanges(user, patch, this.clock());
      return this.updated(await users.update(id, changes));
    });
  }

  /** USR-10, USR-11, USR-12, AUTH-30 (deactivating yourself is forbidden). */
  setStatus(actorId: string, id: string, status: UserStatus): Promise<UserEntity> {
    if (status === 'inactive') {
      assertNotSelf(actorId, id);
    }
    return this.uow.transaction(async ({ users, sessions }) => {
      await this.lockedUser(users, id);
      const now = this.clock();
      const changes = statusChanges(status, now);
      const updated = this.updated(await users.update(id, changes));
      if (endsSessions(changes)) {
        await sessions.terminateActiveForUser(id, now);
      }
      return updated;
    });
  }

  /** USR-13, AUTH-30: sessions and credentials are removed by the foreign key cascade. */
  async delete(actorId: string, id: string): Promise<void> {
    assertNotSelf(actorId, id);
    if (!(await this.uow.repositories.users.delete(id))) {
      throw new AppError('USER_NOT_FOUND');
    }
  }

  private async lockedUser(
    users: UnitOfWork['repositories']['users'],
    id: string,
  ): Promise<UserEntity> {
    const user = await users.findByIdForUpdate(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND');
    }
    return user;
  }

  private updated(user: UserEntity | undefined): UserEntity {
    if (!user) {
      // The row was locked in this transaction, so it cannot have disappeared.
      throw new Error('Locked user row vanished during update');
    }
    return user;
  }
}

/** AUTH-02, AUTH-12: a duplicate email is a conflict with existing state, not a crash. */
export async function createUserOrConflict(
  users: UnitOfWork['repositories']['users'],
  user: Parameters<UnitOfWork['repositories']['users']['create']>[0],
  now: Date,
): Promise<UserEntity> {
  try {
    return await users.create(user, now);
  } catch (error) {
    if (isUniqueViolation(error, EMAIL_UNIQUE_CONSTRAINT)) {
      throw new AppError('EMAIL_ALREADY_REGISTERED', { cause: error });
    }
    throw error;
  }
}
