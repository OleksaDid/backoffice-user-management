import { count } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startTestDatabase, type TestDatabase } from '../../test/support/database.js';
import { resetDemoData } from './demo-data.js';
import { sessions, users } from './schema.js';

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
      .values({ firstName: 'Temp', lastName: 'User' })
      .returning();
    await database.db
      .insert(sessions)
      .values({ userId: someone?.id ?? '', expiresAt: new Date(Date.now() + 60_000) });

    expect(await resetDemoData(database.db)).toBe(20);
    expect(await resetDemoData(database.db)).toBe(20);

    const [userTotal] = await database.db.select({ value: count() }).from(users);
    const [sessionTotal] = await database.db.select({ value: count() }).from(sessions);
    expect(userTotal?.value).toBe(20);
    expect(sessionTotal?.value).toBe(0);

    const inactive = await database.pool.query("select 1 from users where status = 'inactive'");
    expect(inactive.rowCount).toBeGreaterThan(0);
  });
});
