import { isErrorCode, problemDetailsSchema } from '@backoffice/contracts';

import { ApiError, NetworkError } from './errors';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * The single way the app talks to the API. Same origin, so the httpOnly session cookie
 * is sent automatically (AUTH-08); the app never sees the session id. Failures become
 * ApiError (with the catalog code) or NetworkError.
 */
export async function apiRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    throw new NetworkError(error);
  }

  if (response.ok) {
    return (response.status === 204 ? undefined : await response.json()) as T;
  }
  throw await toApiError(response);
}

async function toApiError(response: Response): Promise<ApiError> {
  const parsed = problemDetailsSchema.safeParse(await response.json().catch(() => null));
  if (parsed.success && isErrorCode(parsed.data.code)) {
    const { code, detail, errors } = parsed.data;
    return new ApiError(response.status, code, detail, errors ?? []);
  }
  // Not a problem document (e.g. a proxy error page): keep the status, use a generic code.
  return new ApiError(
    response.status,
    response.status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_FAILED',
    response.statusText || 'Unexpected response from the server.',
  );
}
