import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startTestDatabase, type TestDatabase } from '../../test/support/database.js';
import { createReadinessProbe, MIGRATIONS_FOLDER, runMigrations } from './migrations.js';

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

  it('DATA-02 after the contract step email is required', async () => {
    const result = await database.db.execute<{ is_nullable: string }>(
      sql`select is_nullable from information_schema.columns where table_name = 'users' and column_name = 'email'`,
    );
    expect(result.rows[0]?.is_nullable).toBe('NO');
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

describe('expand/contract on existing data (integration)', () => {
  // Starts its own PostgreSQL container inside the test, so it needs more than the default.
  it(
    'DATA-02 rows from before credentials get a placeholder email, then email is required',
    { timeout: 90_000 },
    async () => {
      const database = await startTestDatabase({ migrate: false });
      const folder = await migrationsUpTo('0001_user_credentials');
      await runMigrations(database.db, folder);
      await database.db.execute(
        sql`insert into users (first_name, last_name) values ('Legacy', 'User')`,
      );
      await database.db.execute(
        sql`insert into users (first_name, last_name, email) values ('New', 'User', 'new@example.com')`,
      );

      await runMigrations(database.db);

      const rows = await database.db.execute<{ first_name: string; email: string }>(
        sql`select first_name, email from users order by first_name`,
      );
      expect(rows.rows[0]?.email).toMatch(/^legacy-[0-9a-f-]{36}@example\.invalid$/);
      expect(rows.rows[1]?.email).toBe('new@example.com');
      await database.stop();
    },
  );
});

describe('readiness when the database goes away (integration)', () => {
  it(
    'HLT-01 reports the database as down without crashing the process',
    { timeout: 90_000 },
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

/** A copy of the migrations folder that stops after `lastTag`, to replay history. */
async function migrationsUpTo(lastTag: string): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'migrations-'));
  await cp(MIGRATIONS_FOLDER, folder, { recursive: true });
  const journalPath = join(folder, 'meta', '_journal.json');
  const journal = JSON.parse(await readFile(journalPath, 'utf8')) as {
    entries: { tag: string }[];
  };
  const last = journal.entries.findIndex((entry) => entry.tag === lastTag);
  journal.entries = journal.entries.slice(0, last + 1);
  await writeFile(journalPath, JSON.stringify(journal));
  return folder;
}
