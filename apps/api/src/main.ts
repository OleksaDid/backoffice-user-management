import closeWithGrace from 'close-with-grace';

import { buildApp } from './app.js';
import { ConfigError, loadConfig } from './config/env.js';
import { createDatabase } from './db/client.js';
import { createReadinessProbe } from './db/migrations.js';
import { LoggerErrorReporter } from './infra/error-reporter.js';
import { createUnitOfWork } from './repositories/unit-of-work.js';
import { systemClock } from './services/clock.js';
import { SessionService } from './services/session-service.js';
import { UserService } from './services/user-service.js';
import { createLogger } from './infra/logger.js';

/** Process entry point: wires real dependencies and owns the process lifecycle. */
async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      // The logger depends on configuration, so this is the one place that writes directly.
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }

  const logger = createLogger(config);
  const errorReporter = new LoggerErrorReporter(logger);
  const database = createDatabase({
    url: config.DATABASE_URL,
    poolMax: config.DATABASE_POOL_MAX,
    onIdleClientError: (error) => {
      logger.warn({ err: error }, 'idle database connection failed');
    },
  });

  const uow = createUnitOfWork(database.db);
  const app = await buildApp({
    config,
    logger,
    errorReporter,
    readinessProbe: createReadinessProbe(database.db),
    services: {
      users: new UserService(uow, systemClock),
      sessions: new SessionService(uow, systemClock, config.SESSION_TTL_HOURS),
    },
  });

  // ERR-13, NFR-32: on SIGTERM/SIGINT stop accepting connections, finish in-flight
  // requests and close the pool. An uncaught exception or unhandled rejection is
  // reported and triggers the same graceful shutdown, exiting non-zero so the
  // container runtime restarts a clean process.
  closeWithGrace({ delay: config.SHUTDOWN_TIMEOUT_MS }, async ({ err, signal }) => {
    if (err) {
      errorReporter.report(err, { source: 'process' });
    } else {
      logger.info({ signal }, 'shutting down');
    }
    await app.close();
    await database.close();
  });

  await app.listen({ host: config.HOST, port: config.PORT });
}

await main();
