import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startTestDatabase, type TestDatabase } from '../../test/support/database.js';
import { createReadinessProbe, runMigrations } from './migrations.js';

describe('migrations (integration)', () => {
  let database: TestDatabase;

  beforeAll(async () => {
    database = await startTestDatabase({ migrate: false });
  });

  afterAll(async () => {
    await database.stop();
  });

  it('HLT-01 reports not ready until migrations are applied', async () => {
    const probe = createReadinessProbe(database.db);
    expect(await probe()).toEqual({ database: true, migrations: false });

    await runMigrations(database.db);
    expect(await probe()).toEqual({ database: true, migrations: true });
  });

  it('DATA-03 applying migrations again is a no-op', async () => {
    await expect(runMigrations(database.db)).resolves.toBeUndefined();
  });

  it('DATA-01 creates the schema: Part 0 tables plus the credentials expand step', async () => {
    const result = await database.db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`,
    );
    expect(result.rows.map((row) => row.table_name)).toEqual([
      'sessions',
      'user_credentials',
      'users',
    ]);
  });

  it('DATA-02 the expand step keeps email nullable, so Part 0 writes still work', async () => {
    const result = await database.db.execute<{ is_nullable: string }>(
      sql`select is_nullable from information_schema.columns where table_name = 'users' and column_name = 'email'`,
    );
    expect(result.rows[0]?.is_nullable).toBe('YES');
  });

  it('AUTH-10 emails are unique regardless of case', async () => {
    await database.db.execute(
      sql`insert into users (first_name, last_name, email) values ('A', 'B', 'Ada@Example.com')`,
    );
    await expect(
      database.db.execute(
        sql`insert into users (first_name, last_name, email) values ('C', 'D', 'ada@example.COM')`,
      ),
    ).rejects.toThrow();
  });
});

describe('readiness when the database goes away (integration)', () => {
  it(
    'HLT-01 reports the database as down without crashing the process',
    { timeout: 30_000 },
    async () => {
      const database = await startTestDatabase();
      const probe = createReadinessProbe(database.db);
      expect(await probe()).toEqual({ database: true, migrations: true });

      await database.container.stop();
      expect(await probe()).toEqual({ database: false, migrations: false });
      await database.close();
    },
  );
});
