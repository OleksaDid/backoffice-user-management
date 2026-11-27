import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export interface ReadinessReport {
  database: boolean;
  migrations: boolean;
}

/** Checks the dependencies the API needs to serve traffic. */
export type ReadinessProbe = () => Promise<ReadinessReport>;

const checkState = z.enum(['ok', 'failing']);
const readinessSchema = z.object({
  status: z.enum(['ok', 'unavailable']),
  checks: z.object({ database: checkState, migrations: checkState }),
});

/**
 * HLT-01: liveness says the process runs; readiness says it can serve requests
 * (database reachable and all migrations applied). Used by container health checks.
 */
export const healthRoutes =
  (probe: ReadinessProbe, revision: string): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    app.get(
      '/health/live',
      {
        schema: {
          tags: ['health'],
          summary: 'Liveness probe, with the revision of the running image',
          response: { 200: z.object({ status: z.literal('ok'), revision: z.string() }) },
        },
      },
      // The revision lets a deployment check that the new image, not the old, is serving.
      () => ({ status: 'ok' as const, revision }),
    );

    app.get(
      '/health/ready',
      {
        schema: {
          tags: ['health'],
          summary: 'Readiness probe',
          response: { 200: readinessSchema, 503: readinessSchema },
        },
      },
      async (request, reply) => {
        const report = await probe().catch((error: unknown) => {
          request.log.warn({ err: error }, 'readiness probe failed');
          return { database: false, migrations: false };
        });
        const ready = report.database && report.migrations;
        return reply.status(ready ? 200 : 503).send({
          status: ready ? 'ok' : 'unavailable',
          checks: {
            database: report.database ? 'ok' : 'failing',
            migrations: report.migrations ? 'ok' : 'failing',
          },
        });
      },
    );

    done();
  };
