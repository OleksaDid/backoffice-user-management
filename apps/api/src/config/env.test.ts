import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from './env.js';

const minimal = { DATABASE_URL: 'postgres://app:secret@localhost:5432/app' };

describe('loadConfig', () => {
  it('NFR-15 applies defaults for optional variables', () => {
    const config = loadConfig(minimal);
    expect(config).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      DATABASE_POOL_MAX: 10,
      TRUST_PROXY_HOPS: 0,
    });
  });

  it('NFR-15 coerces numbers and booleans from strings', () => {
    const config = loadConfig({ ...minimal, PORT: '8081', LOG_PRETTY: 'true' });
    expect(config.PORT).toBe(8081);
    expect(config.LOG_PRETTY).toBe(true);
  });

  it('AUTH-21 requires PUBLIC_ORIGIN in production and normalises it', () => {
    expect(() => loadConfig({ ...minimal, NODE_ENV: 'production' })).toThrow(/PUBLIC_ORIGIN/);
    expect(
      loadConfig({ ...minimal, NODE_ENV: 'production', PUBLIC_ORIGIN: 'https://test.oleksa.live/' })
        .PUBLIC_ORIGIN,
    ).toBe('https://test.oleksa.live');
    expect(loadConfig(minimal).PUBLIC_ORIGIN).toBe('http://localhost:8080');
  });

  it('AUTH-20 refuses insecure session cookies in production', () => {
    expect(() =>
      loadConfig({
        ...minimal,
        NODE_ENV: 'production',
        PUBLIC_ORIGIN: 'https://test.oleksa.live',
        COOKIE_SECURE: 'false',
      }),
    ).toThrow(/COOKIE_SECURE/);
  });

  it('NFR-15 refuses to start without a database URL', () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
  });

  it('NFR-15 lists every invalid variable without echoing secret values', () => {
    try {
      loadConfig({ DATABASE_URL: 'mysql://user:hunter2@db/app', PORT: '99999' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      const { issues, message } = error as ConfigError;
      expect(issues).toHaveLength(2);
      expect(message).toContain('DATABASE_URL');
      expect(message).toContain('PORT');
      expect(message).not.toContain('hunter2');
    }
  });
});
