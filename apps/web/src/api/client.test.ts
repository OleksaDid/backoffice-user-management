import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server, setupMockServer } from '../test/server';

import { apiRequest } from './client';
import { ApiError, NetworkError } from './errors';
import { messageFor } from './error-messages';

setupMockServer();

describe('apiRequest', () => {
  it('returns parsed JSON and undefined for 204', async () => {
    server.use(
      http.get('/api/ok', () => HttpResponse.json({ ok: true })),
      http.delete('/api/gone', () => new HttpResponse(null, { status: 204 })),
    );
    expect(await apiRequest('GET', '/ok')).toEqual({ ok: true });
    expect(await apiRequest('DELETE', '/gone')).toBeUndefined();
  });

  it('ERR-20 turns problem details into an ApiError with code and field errors', async () => {
    server.use(
      http.post('/api/users', () =>
        HttpResponse.json(
          {
            type: 'urn:backoffice:problem:validation-failed',
            title: 'Validation failed',
            status: 400,
            code: 'VALIDATION_FAILED',
            detail: 'The request contains invalid data.',
            errors: [{ path: 'email', message: 'Invalid email' }],
          },
          { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );

    const error = await apiRequest('POST', '/users', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_FAILED',
      fieldErrors: [{ path: 'email', message: 'Invalid email' }],
    });
  });

  it('ERR-20 keeps the status of non-problem error pages', async () => {
    server.use(http.get('/api/proxy', () => new HttpResponse('Bad gateway', { status: 502 })));
    await expect(apiRequest('GET', '/proxy')).rejects.toMatchObject({
      status: 502,
      code: 'INTERNAL_ERROR',
    });
  });

  it('ERR-20 derives the closest code for non-problem error pages', async () => {
    server.use(
      http.get('/api/missing', () => new HttpResponse('<html>', { status: 404 })),
      http.get('/api/busy', () => new HttpResponse('<html>', { status: 429 })),
      http.get('/api/restarting', () => new HttpResponse('<html>', { status: 503 })),
    );
    await expect(apiRequest('GET', '/missing')).rejects.toMatchObject({ code: 'ROUTE_NOT_FOUND' });
    await expect(apiRequest('GET', '/busy')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    await expect(apiRequest('GET', '/restarting')).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    });
  });

  it('ERR-20 reports unreachable servers as a NetworkError', async () => {
    server.use(http.get('/api/down', () => HttpResponse.error()));
    await expect(apiRequest('GET', '/down')).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('messageFor', () => {
  it('ERR-21 maps codes and network failures to user-facing messages', () => {
    expect(messageFor(new ApiError(401, 'INVALID_CREDENTIALS', 'x'))).toBe(
      'Invalid email or password.',
    );
    expect(messageFor(new NetworkError(null))).toMatch(/could not be reached/);
    expect(messageFor(new Error('boom'))).toMatch(/Something went wrong/);
  });
});
