import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { createDatabase, type DatabaseHandle } from '../../src/db/client.js';
import { runMigrations } from '../../src/db/migrations.js';

export interface TestDatabase extends DatabaseHandle {
  container: StartedPostgreSqlContainer;
  stop: () => Promise<void>;
}

/** Starts a throwaway PostgreSQL 17 container, optionally with all migrations applied. */
export async function startTestDatabase(
  options: { migrate?: boolean } = {},
): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  const handle = createDatabase({ url: container.getConnectionUri(), poolMax: 5 });
  if (options.migrate ?? true) {
    await runMigrations(handle.db);
  }
  return {
    ...handle,
    container,
    stop: async () => {
      await handle.close();
      await container.stop();
    },
  };
}
