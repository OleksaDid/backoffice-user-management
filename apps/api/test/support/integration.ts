import { sql } from 'drizzle-orm';
import { pino } from 'pino';
import { afterAll, beforeAll, beforeEach } from 'vitest';

import { buildApp } from '../../src/app.js';
import { createReadinessProbe } from '../../src/db/migrations.js';
import type { App } from '../../src/http/types.js';
import { LoggerErrorReporter } from '../../src/infra/error-reporter.js';
import { createUnitOfWork } from '../../src/repositories/unit-of-work.js';
import { SessionService } from '../../src/services/session-service.js';
import { UserService } from '../../src/services/user-service.js';
import { startTestDatabase, type TestDatabase } from './database.js';

export interface IntegrationContext {
  app: App;
  database: TestDatabase;
  /** Controls "now" for the services; advance it to observe updatedAt changes. */
  clock: { now: Date; advance: (ms: number) => void };
}

/**
 * Full app against a real PostgreSQL container, shared by the tests of one file.
 * Tables are emptied before each test, so tests stay independent.
 */
export function useIntegrationApp(options: { sessionTtlHours?: number } = {}): IntegrationContext {
  const context = {
    clock: {
      now: new Date('2026-03-01T10:00:00.000Z'),
      advance(ms: number) {
        this.now = new Date(this.now.getTime() + ms);
      },
    },
  } as IntegrationContext;

  beforeAll(async () => {
    context.database = await startTestDatabase();
    const uow = createUnitOfWork(context.database.db);
    const clock = () => context.clock.now;
    const logger = pino({ level: 'silent' });
    context.app = await buildApp({
      config: { NODE_ENV: 'test', TRUST_PROXY_HOPS: 0 },
      logger,
      errorReporter: new LoggerErrorReporter(logger),
      readinessProbe: createReadinessProbe(context.database.db),
      services: {
        users: new UserService(uow, clock),
        sessions: new SessionService(uow, clock, options.sessionTtlHours ?? 168),
      },
    });
    await context.app.ready();
  });

  beforeEach(async () => {
    await context.database.db.execute(sql`truncate table sessions, users cascade`);
    context.clock.now = new Date('2026-03-01T10:00:00.000Z');
  });

  afterAll(async () => {
    await context.app.close();
    await context.database.stop();
  });

  return context;
}
