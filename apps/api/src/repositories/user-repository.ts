import type { UserStatus } from '@backoffice/contracts';
import { count, desc, eq, sql } from 'drizzle-orm';

import { users } from '../db/schema.js';
import type { UserChanges, UserEntity } from '../domain/user.js';
import type { Executor } from './executor.js';

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
}

/** Name of the unique index that enforces AUTH-10. */
export const EMAIL_UNIQUE_CONSTRAINT = 'users_email_lower_unique';

export class UserRepository {
  constructor(private readonly db: Executor) {}

  async create(user: NewUser, now: Date): Promise<UserEntity> {
    const [row] = await this.db
      .insert(users)
      .values({ ...user, createdAt: now, updatedAt: now })
      .returning();
    if (!row) {
      throw new Error('Insert into users returned no row');
    }
    return row;
  }

  /** USR-03, USR-05, NFR-40: one indexed page query and the total, in parallel. */
  async page(options: {
    limit: number;
    offset: number;
  }): Promise<{ items: UserEntity[]; total: number }> {
    const [items, [totals]] = await Promise.all([
      this.db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt), desc(users.id))
        .limit(options.limit)
        .offset(options.offset),
      this.db.select({ total: count() }).from(users),
    ]);
    return { items, total: totals?.total ?? 0 };
  }

  async findById(id: string): Promise<UserEntity | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row;
  }

  /** AUTH-03: emails are stored lower-cased; the lookup uses the lower(email) index. */
  async findByEmail(email: string): Promise<UserEntity | undefined> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`);
    return row;
  }

  /** Locks the row until the surrounding transaction ends, so checks and writes are atomic. */
  async findByIdForUpdate(id: string): Promise<UserEntity | undefined> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).for('update');
    return row;
  }

  async update(id: string, changes: UserChanges): Promise<UserEntity | undefined> {
    const [row] = await this.db.update(users).set(changes).where(eq(users.id, id)).returning();
    return row;
  }

  /** SES-03, DATA-11: increment in SQL so concurrent sign-ins never lose a count. */
  async incrementLogins(id: string, now: Date): Promise<void> {
    await this.db
      .update(users)
      .set({ loginsCount: sql`${users.loginsCount} + 1`, updatedAt: now })
      .where(eq(users.id, id));
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return deleted.length > 0;
  }
}
