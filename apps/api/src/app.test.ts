import { afterEach, describe, expect, it } from 'vitest';

import { buildTestApp, type TestAppOptions } from '../test/support/build-test-app.js';
import type { App } from './http/types.js';

let app: App | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function start(options?: TestAppOptions) {
  ({ app } = await buildTestApp(options));
  return app;
}

describe('health', () => {
  it('HLT-01 liveness answers while the process runs', async () => {
    const response = await (await start()).inject({ url: '/api/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('HLT-01 NFR-31 readiness is 200 when the database is reachable and migrated', async () => {
    const response = await (await start()).inject({ url: '/api/health/ready' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      checks: { database: 'ok', migrations: 'ok' },
    });
  });

  it('HLT-01 readiness is 503 when migrations are pending', async () => {
    const response = await (
      await start({ readinessProbe: () => Promise.resolve({ database: true, migrations: false }) })
    ).inject({ url: '/api/health/ready' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ checks: { migrations: 'failing' } });
  });

  it('HLT-01 readiness is 503 when the probe itself fails', async () => {
    const response = await (
      await start({ readinessProbe: () => Promise.reject(new Error('ECONNREFUSED')) })
    ).inject({ url: '/api/health/ready' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 'unavailable' });
  });
});

describe('cross-cutting HTTP behaviour', () => {
  it('NFR-30 returns a request id and reuses a well-formed incoming one', async () => {
    const server = await start();
    const generated = await server.inject({ url: '/api/health/live' });
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const forwarded = await server.inject({
      url: '/api/health/live',
      headers: { 'x-request-id': 'proxy-request-0001' },
    });
    expect(forwarded.headers['x-request-id']).toBe('proxy-request-0001');
  });

  it('NFR-30 replaces a malformed incoming request id', async () => {
    const response = await (
      await start()
    ).inject({
      url: '/api/health/live',
      headers: { 'x-request-id': 'bad id with spaces' },
    });
    expect(response.headers['x-request-id']).not.toBe('bad id with spaces');
  });

  it('NFR-12 sends security headers and forbids caching of API responses', async () => {
    const response = await (await start()).inject({ url: '/api/health/live' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('API-01 serves the OpenAPI document generated from route schemas', async () => {
    const response = await (await start()).inject({ url: '/api/docs/json' });
    expect(response.statusCode).toBe(200);
    const document = response.json<{ openapi: string; paths: Record<string, unknown> }>();
    expect(document.openapi).toBe('3.1.0');
    expect(document.paths).toHaveProperty('/api/health/ready');
  });
});
