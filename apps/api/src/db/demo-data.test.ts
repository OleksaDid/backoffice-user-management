import { count, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startTestDatabase, type TestDatabase } from '../../test/support/database.js';
import { PasswordHasher } from '../security/password-hasher.js';
import { DEMO_PASSWORD, resetDemoData } from './demo-data.js';
import { sessions, userCredentials, users } from './schema.js';

const hasher = new PasswordHasher({ N: 2 ** 10, r: 8, p: 1 });

describe('demo data reset (integration)', () => {
  let database: TestDatabase;

  beforeAll(async () => {
    database = await startTestDatabase();
  });

  afterAll(async () => {
    await database.stop();
  });

  it('NFR-34 replaces all users and sessions with the demo set, repeatably', async () => {
    const [someone] = await database.db
      .insert(users)
      .values({ firstName: 'Temp', lastName: 'User', email: 'temp@example.com' })
      .returning();
    await database.db
      .insert(sessions)
      .values({ userId: someone?.id ?? '', expiresAt: new Date(Date.now() + 60_000) });

    expect(await resetDemoData(database.db, hasher)).toBe(20);
    expect(await resetDemoData(database.db, hasher)).toBe(20);

    const [userTotal] = await database.db.select({ value: count() }).from(users);
    const [sessionTotal] = await database.db.select({ value: count() }).from(sessions);
    expect(userTotal?.value).toBe(20);
    expect(sessionTotal?.value).toBe(0);

    const inactive = await database.pool.query("select 1 from users where status = 'inactive'");
    expect(inactive.rowCount).toBeGreaterThan(0);
  });

  it('NFR-34 demo users can sign in with the documented password', async () => {
    await resetDemoData(database.db, hasher);
    const [credential] = await database.db
      .select({ hash: userCredentials.passwordHash, email: users.email })
      .from(userCredentials)
      .innerJoin(users, eq(users.id, userCredentials.userId))
      .where(eq(users.email, 'ada.lovelace@example.com'));

    expect(credential).toBeDefined();
    expect(await hasher.verify(DEMO_PASSWORD, credential?.hash ?? '')).toBe(true);
  });
});
