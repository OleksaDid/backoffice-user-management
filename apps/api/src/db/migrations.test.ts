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

  it('DATA-01 creates the Part 0 schema', async () => {
    const result = await database.db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`,
    );
    expect(result.rows.map((row) => row.table_name)).toEqual(['sessions', 'users']);
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
