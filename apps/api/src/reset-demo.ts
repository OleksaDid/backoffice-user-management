import { loadConfig } from './config/env.js';
import { createDatabase } from './db/client.js';
import { resetDemoData } from './db/demo-data.js';
import { createLogger } from './infra/logger.js';
import { PasswordHasher } from './security/password-hasher.js';

/**
 * Nightly demo reset on public environments (NFR-34): `npm run db:reset-demo`.
 * Non-interactive, idempotent, exits non-zero on failure.
 */
const config = loadConfig();
const logger = createLogger(config);
const database = createDatabase({ url: config.DATABASE_URL, poolMax: 1 });

try {
  const count = await resetDemoData(database.db, new PasswordHasher());
  logger.info({ users: count }, 'demo data reset');
} catch (error) {
  logger.fatal({ err: error }, 'demo data reset failed');
  process.exitCode = 1;
} finally {
  await database.close();
}
