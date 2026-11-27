import { pino } from 'pino';
import { vi } from 'vitest';

import { type AppDependencies, buildApp } from '../../src/app.js';
import type { ReadinessProbe } from '../../src/http/routes/health.js';
import type { ErrorReporter } from '../../src/infra/error-reporter.js';

/** Public origin the test apps are configured with (AUTH-21). */
export const TEST_ORIGIN = 'https://backoffice.test';

export interface TestAppOptions {
  readinessProbe?: ReadinessProbe;
  services?: AppDependencies['services'];
  authRateLimit?: number;
}

/** Stands in for a service in tests that never reach domain endpoints: any call is a test bug. */
function unusedService(name: string): never {
  return new Proxy(
    {},
    {
      get: (_target, method) => () => {
        throw new Error(`${name}.${String(method)} called on a test app built without services`);
      },
    },
  ) as never;
}

const unusedServices: AppDependencies['services'] = {
  users: unusedService('users'),
  sessions: unusedService('sessions'),
  auth: unusedService('auth'),
};

/** Builds the app with silent logging, a spy reporter and a healthy probe by default. */
export async function buildTestApp(options: TestAppOptions = {}) {
  const errorReporter = { report: vi.fn<ErrorReporter['report']>() };
  const app = await buildApp({
    config: {
      NODE_ENV: 'test',
      TRUST_PROXY_HOPS: 0,
      COOKIE_SECURE: true,
      PUBLIC_ORIGIN: TEST_ORIGIN,
      AUTH_RATE_LIMIT_PER_MINUTE: options.authRateLimit ?? 1000,
      APP_REVISION: 'test-revision',
    },
    logger: pino({ level: 'silent' }),
    errorReporter,
    readinessProbe:
      options.readinessProbe ?? (() => Promise.resolve({ database: true, migrations: true })),
    services: options.services ?? unusedServices,
  });
  return { app, errorReporter };
}
