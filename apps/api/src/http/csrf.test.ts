import { afterEach, describe, expect, it } from 'vitest';

import { buildTestApp, TEST_ORIGIN } from '../../test/support/build-test-app.js';
import type { App } from './types.js';

let app: App | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function start() {
  ({ app } = await buildTestApp());
  app.post('/test/mutate', () => ({ ok: true }));
  await app.ready();
  return app;
}

describe('CSRF guard', () => {
  it('AUTH-21 accepts state-changing requests from the public origin', async () => {
    const response = await (
      await start()
    ).inject({
      method: 'POST',
      url: '/test/mutate',
      headers: { origin: TEST_ORIGIN, 'sec-fetch-site': 'same-origin' },
    });
    expect(response.statusCode).toBe(200);
  });

  it('AUTH-21 rejects state-changing requests from another origin', async () => {
    const response = await (
      await start()
    ).inject({
      method: 'POST',
      url: '/test/mutate',
      headers: { origin: 'https://evil.example' },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'CSRF_REJECTED' });
  });

  it('AUTH-21 rejects requests the browser marks as cross-site', async () => {
    const response = await (
      await start()
    ).inject({
      method: 'POST',
      url: '/test/mutate',
      headers: { 'sec-fetch-site': 'cross-site' },
    });
    expect(response.statusCode).toBe(403);
  });

  it('AUTH-21 lets safe methods and non-browser clients through', async () => {
    const server = await start();
    const read = await server.inject({
      url: '/api/health/live',
      headers: { origin: 'https://evil.example' },
    });
    expect(read.statusCode).toBe(200);
    const cli = await server.inject({ method: 'POST', url: '/test/mutate' });
    expect(cli.statusCode).toBe(200);
  });
});
