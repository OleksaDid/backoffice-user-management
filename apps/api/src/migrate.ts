import { loadConfig } from './config/env.js';
import { createDatabase } from './db/client.js';
import { runMigrations } from './db/migrations.js';
import { createLogger } from './infra/logger.js';

/**
 * One-off migration step (DATA-03), run before the API starts: `npm run migrate`.
 * Idempotent (applied migrations are skipped) and exits non-zero on failure.
 */
const config = loadConfig();
const logger = createLogger(config);
const database = createDatabase({ url: config.DATABASE_URL, poolMax: 1 });

try {
  await runMigrations(database.db);
  logger.info('migrations applied');
} catch (error) {
  logger.fatal({ err: error }, 'migrations failed');
  process.exitCode = 1;
} finally {
  await database.close();
}
