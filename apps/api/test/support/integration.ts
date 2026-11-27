import type { AuthResponse } from '@backoffice/contracts';
import { sql } from 'drizzle-orm';
import type { InjectOptions, LightMyRequestResponse } from 'fastify';
import { pino } from 'pino';
import { afterAll, beforeAll, beforeEach } from 'vitest';

import { buildApp } from '../../src/app.js';
import { createReadinessProbe } from '../../src/db/migrations.js';
import type { App } from '../../src/http/types.js';
import { LoggerErrorReporter } from '../../src/infra/error-reporter.js';
import { createUnitOfWork } from '../../src/repositories/unit-of-work.js';
import { PasswordHasher } from '../../src/security/password-hasher.js';
import { AuthService } from '../../src/services/auth-service.js';
import { SessionService } from '../../src/services/session-service.js';
import { UserService } from '../../src/services/user-service.js';
import { TEST_ORIGIN } from './build-test-app.js';
import { startTestDatabase, type TestDatabase } from './database.js';

/** Low-cost hashing keeps integration tests fast; production uses the default cost. */
export const testHasher = new PasswordHasher({ N: 2 ** 10, r: 8, p: 1 });

/** Credentials of the administrator every integration test signs in as. */
export const ADMIN = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'admin password',
};

let emailSequence = 0;

/** A unique, valid email for test data. */
export function uniqueEmail(prefix = 'user'): string {
  emailSequence += 1;
  return `${prefix}${emailSequence}@example.com`;
}

export interface IntegrationContext {
  app: App;
  /** The administrator signed up before each test (created an hour before "now"). */
  admin: AuthResponse;
  /** Injects a request authenticated as the administrator. */
  inject: (options: InjectOptions) => Promise<LightMyRequestResponse>;
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
  context.inject = (request) => {
    // Explicit cookies in the request win over the administrator's session.
    return context.app.inject({
      ...request,
      cookies: request.cookies ?? { sid: context.admin.session.id },
    });
  };

  beforeAll(async () => {
    context.database = await startTestDatabase();
    const uow = createUnitOfWork(context.database.db);
    const clock = () => context.clock.now;
    const logger = pino({ level: 'silent' });
    context.app = await buildApp({
      config: {
        NODE_ENV: 'test',
        TRUST_PROXY_HOPS: 0,
        COOKIE_SECURE: true,
        PUBLIC_ORIGIN: TEST_ORIGIN,
      },
      clock,
      logger,
      errorReporter: new LoggerErrorReporter(logger),
      readinessProbe: createReadinessProbe(context.database.db),
      services: {
        users: new UserService(uow, clock, testHasher),
        sessions: new SessionService(uow, clock, options.sessionTtlHours ?? 168),
        auth: new AuthService(uow, clock, testHasher, options.sessionTtlHours ?? 168),
      },
    });
    await context.app.ready();
  });

  beforeEach(async () => {
    await context.database.db.execute(sql`truncate table sessions, users cascade`);
    context.clock.now = new Date('2026-03-01T09:00:00.000Z');
    const signUp = await context.app.inject({
      method: 'POST',
      url: '/api/auth/sign-up',
      payload: ADMIN,
    });
    context.admin = signUp.json<AuthResponse>();
    context.clock.now = new Date('2026-03-01T10:00:00.000Z');
  });

  afterAll(async () => {
    await context.app.close();
    await context.database.stop();
  });

  return context;
}
