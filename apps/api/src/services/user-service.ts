import {
  type CreateUserBody,
  type Paginated,
  type PaginationQuery,
  totalPages,
  type UpdateUserProfileBody,
  type UserStatus,
} from '@backoffice/contracts';

import { endsSessions, profileChanges, statusChanges, type UserEntity } from '../domain/user.js';
import { AppError } from '../errors/app-error.js';
import type { UnitOfWork } from '../repositories/unit-of-work.js';
import type { Clock } from './clock.js';

/** Use cases of the users API (spec 01). */
export class UserService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
  ) {}

  /** USR-01 */
  create(body: CreateUserBody): Promise<UserEntity> {
    return this.uow.repositories.users.create(
      { firstName: body.firstName, lastName: body.lastName, status: body.status ?? 'active' },
      this.clock(),
    );
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

  /** USR-10, USR-11, USR-12 */
  setStatus(id: string, status: UserStatus): Promise<UserEntity> {
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

  /** USR-13: sessions are removed by the foreign key cascade. */
  async delete(id: string): Promise<void> {
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
