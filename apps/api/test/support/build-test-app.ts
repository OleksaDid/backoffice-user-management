import { pino } from 'pino';
import { vi } from 'vitest';

import { buildApp } from '../../src/app.js';
import type { ReadinessProbe } from '../../src/http/routes/health.js';
import type { ErrorReporter } from '../../src/infra/error-reporter.js';

export interface TestAppOptions {
  readinessProbe?: ReadinessProbe;
}

/** Builds the app with silent logging, a spy reporter and a healthy probe by default. */
export async function buildTestApp(options: TestAppOptions = {}) {
  const errorReporter = { report: vi.fn<ErrorReporter['report']>() };
  const app = await buildApp({
    config: { NODE_ENV: 'test', TRUST_PROXY_HOPS: 0 },
    logger: pino({ level: 'silent' }),
    errorReporter,
    readinessProbe:
      options.readinessProbe ?? (() => Promise.resolve({ database: true, migrations: true })),
  });
  return { app, errorReporter };
}
