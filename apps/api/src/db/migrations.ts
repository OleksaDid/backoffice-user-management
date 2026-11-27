import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import type { ReadinessProbe } from '../http/routes/health.js';
import type { Database } from './client.js';

/**
 * Location of the committed SQL migrations. In development this file lives in
 * src/db/, in the production bundle in dist/; both resolve to apps/api/migrations.
 */
export const MIGRATIONS_FOLDER = fileURLToPath(
  new URL(
    import.meta.url.includes('/src/') ? '../../migrations' : '../migrations',
    import.meta.url,
  ),
);

export async function runMigrations(db: Database, folder = MIGRATIONS_FOLDER): Promise<void> {
  await migrate(db, { migrationsFolder: folder });
}

interface Journal {
  entries: { idx: number; when: number; tag: string }[];
}

/** Timestamp of the newest migration shipped with this build. */
export async function latestBundledMigration(folder = MIGRATIONS_FOLDER): Promise<number> {
  const journal = JSON.parse(await readFile(`${folder}/meta/_journal.json`, 'utf8')) as Journal;
  return Math.max(...journal.entries.map((entry) => entry.when));
}

/**
 * HLT-01 readiness: the database answers and the newest bundled migration is applied.
 * An image that is newer than the schema reports "not ready" instead of failing on
 * the first query that touches a missing column.
 */
export function createReadinessProbe(db: Database, folder = MIGRATIONS_FOLDER): ReadinessProbe {
  const expected = latestBundledMigration(folder);
  return async () => {
    try {
      await db.execute(sql`select 1`);
    } catch {
      return { database: false, migrations: false };
    }
    try {
      const result = await db.execute<{ latest: string | null }>(
        sql`select max(created_at)::text as latest from drizzle.__drizzle_migrations`,
      );
      const latest = Number(result.rows[0]?.latest ?? 0);
      return { database: true, migrations: latest >= (await expected) };
    } catch {
      // The migrations table does not exist yet: nothing has been applied.
      return { database: true, migrations: false };
    }
  };
}
