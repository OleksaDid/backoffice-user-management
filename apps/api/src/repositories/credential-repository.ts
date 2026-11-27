import { eq } from 'drizzle-orm';

import { userCredentials } from '../db/schema.js';
import type { Executor } from './executor.js';

/** Password hashes (ADR 0004). Nothing outside authentication reads this table. */
export class CredentialRepository {
  constructor(private readonly db: Executor) {}

  async setPassword(userId: string, passwordHash: string, now: Date): Promise<void> {
    await this.db
      .insert(userCredentials)
      .values({ userId, passwordHash, passwordUpdatedAt: now })
      .onConflictDoUpdate({
        target: userCredentials.userId,
        set: { passwordHash, passwordUpdatedAt: now },
      });
  }

  async passwordHashOf(userId: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ passwordHash: userCredentials.passwordHash })
      .from(userCredentials)
      .where(eq(userCredentials.userId, userId));
    return row?.passwordHash;
  }
}
