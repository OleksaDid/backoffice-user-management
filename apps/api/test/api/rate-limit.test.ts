import { describe, expect, it } from 'vitest';

import { useIntegrationApp } from '../support/integration.js';

// This file's app allows 3 attempts per minute and client IP. The administrator's
// sign-up before each test comes from the default test address, not the ones below.
const ctx = useIntegrationApp({ authRateLimit: 3 });

describe('authentication rate limiting (integration)', () => {
  it('AUTH-40 limits sign-in attempts per client IP with Retry-After', async () => {
    const attempt = () =>
      ctx.app.inject({
        method: 'POST',
        url: '/api/auth/sign-in',
        payload: { email: 'nobody@example.com', password: 'wrong password' },
        remoteAddress: '203.0.113.7',
      });

    expect((await attempt()).statusCode).toBe(401);
    expect((await attempt()).statusCode).toBe(401);
    expect((await attempt()).statusCode).toBe(401);
    const limited = await attempt();

    expect(limited.statusCode).toBe(429);
    expect(limited.json()).toMatchObject({ code: 'RATE_LIMITED' });
    expect(limited.headers['retry-after']).toBeDefined();

    const otherClient = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: 'nobody@example.com', password: 'wrong password' },
      remoteAddress: '198.51.100.9',
    });
    expect(otherClient.statusCode).toBe(401);
  });
});
