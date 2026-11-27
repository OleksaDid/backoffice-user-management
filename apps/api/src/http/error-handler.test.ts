import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildTestApp } from '../../test/support/build-test-app.js';
import { AppError } from '../errors/app-error.js';
import type { App } from './types.js';

let app: App | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function appWithRoutes() {
  const built = await buildTestApp();
  app = built.app;
  app.get('/test/app-error', () => {
    throw new AppError('USER_NAME_LOCKED');
  });
  app.get('/test/crash', () => {
    throw new Error('connection string postgres://secret@db leaked');
  });
  app.get('/test/db-down', () => {
    throw Object.assign(new Error('connect ECONNREFUSED 10.0.0.5:5432'), { code: 'ECONNREFUSED' });
  });
  app.post(
    '/test/validate',
    { schema: { body: z.strictObject({ firstName: z.string().min(1) }) } },
    () => ({ ok: true }),
  );
  await app.ready();
  return { app, errorReporter: built.errorReporter };
}

describe('central error handling', () => {
  it('ERR-01 renders application errors as RFC 9457 problem details', async () => {
    const { app } = await appWithRoutes();
    const response = await app.inject({ method: 'GET', url: '/test/app-error' });

    expect(response.statusCode).toBe(409);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toEqual({
      type: 'urn:backoffice:problem:user-name-locked',
      title: 'User name locked',
      status: 409,
      code: 'USER_NAME_LOCKED',
      detail: 'First and last name cannot be changed while the user is inactive.',
      requestId: response.headers['x-request-id'],
    });
  });

  it('ERR-11 hides internals of unexpected errors behind a generic 500', async () => {
    const { app, errorReporter } = await appWithRoutes();
    const response = await app.inject({ method: 'GET', url: '/test/crash' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(response.body).not.toContain('secret');
    expect(errorReporter.report).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('leaked') as string }),
      expect.objectContaining({ source: 'request', route: '/test/crash' }),
    );
  });

  it('ERR-11 reports schema violations as VALIDATION_FAILED with field paths', async () => {
    const { app } = await appWithRoutes();
    const response = await app.inject({
      method: 'POST',
      url: '/test/validate',
      payload: { firstName: '' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ path: 'firstName' }],
    });
  });

  it('ERR-11 reports each unknown field separately', async () => {
    const { app } = await appWithRoutes();
    const response = await app.inject({
      method: 'POST',
      url: '/test/validate',
      payload: { firstName: 'Ada', createdAt: 'x', id: 'y' },
    });

    expect(response.statusCode).toBe(400);
    const paths = response.json<{ errors: { path: string }[] }>().errors.map((e) => e.path);
    expect(paths.sort()).toEqual(['createdAt', 'id']);
  });

  it('ERR-11 maps malformed JSON to VALIDATION_FAILED', async () => {
    const { app } = await appWithRoutes();
    const response = await app.inject({
      method: 'POST',
      url: '/test/validate',
      headers: { 'content-type': 'application/json' },
      payload: '{"firstName":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('ERR-14 answers unknown routes with ROUTE_NOT_FOUND', async () => {
    const { app } = await appWithRoutes();
    const response = await app.inject({ method: 'GET', url: '/api/nope' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'ROUTE_NOT_FOUND', status: 404 });
  });
});

describe('error mapping for framework and infrastructure failures', () => {
  it('ERR-11 maps unsupported media types and oversized bodies to their own codes', async () => {
    const { app } = await appWithRoutes();
    const xml = await app.inject({
      method: 'POST',
      url: '/test/validate',
      headers: { 'content-type': 'application/xml' },
      payload: '<user/>',
    });
    expect(xml.statusCode).toBe(415);
    expect(xml.json()).toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE' });

    const huge = await app.inject({
      method: 'POST',
      url: '/test/validate',
      payload: { firstName: 'a'.repeat(70_000) },
    });
    expect(huge.statusCode).toBe(413);
    expect(huge.json()).toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  });

  it('ERR-11 answers 503 when the database cannot be reached', async () => {
    const { app, errorReporter } = await appWithRoutes();
    const response = await app.inject({ url: '/test/db-down' });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    expect(response.body).not.toContain('10.0.0.5');
    expect(errorReporter.report).toHaveBeenCalled();
  });
});
