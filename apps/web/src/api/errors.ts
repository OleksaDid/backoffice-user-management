import type { ErrorCode, FieldError } from '@backoffice/contracts';

/** ERR-20: an error response from the API, parsed from RFC 9457 problem details. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    readonly detail: string,
    readonly fieldErrors: FieldError[] = [],
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

/** ERR-20: the request never got an HTTP answer (offline, DNS, CORS); safe to retry. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('The server could not be reached.', { cause });
    this.name = 'NetworkError';
  }
}

export function isApiError(error: unknown, code?: ErrorCode): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}
