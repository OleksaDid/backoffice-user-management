/**
 * Error catalog shared by the API and the web app (spec 05, ERR-01/ERR-02).
 * Clients branch on `code`; `title` is a short human-readable summary and
 * `defaultDetail` is used when no more specific message is available.
 */
export const errorCatalog = {
  VALIDATION_FAILED: {
    status: 400,
    title: 'Validation failed',
    defaultDetail: 'The request contains invalid data.',
  },
  UNAUTHENTICATED: {
    status: 401,
    title: 'Unauthenticated',
    defaultDetail: 'Sign in to continue.',
  },
  INVALID_CREDENTIALS: {
    status: 401,
    title: 'Invalid credentials',
    defaultDetail: 'Invalid email or password.',
  },
  USER_INACTIVE: {
    status: 403,
    title: 'User inactive',
    defaultDetail: 'Inactive users cannot start a session.',
  },
  CSRF_REJECTED: {
    status: 403,
    title: 'Cross-site request rejected',
    defaultDetail: 'The request origin is not allowed.',
  },
  USER_NOT_FOUND: {
    status: 404,
    title: 'User not found',
    defaultDetail: 'The user does not exist.',
  },
  SESSION_NOT_FOUND: {
    status: 404,
    title: 'Session not found',
    defaultDetail: 'The session does not exist.',
  },
  ROUTE_NOT_FOUND: {
    status: 404,
    title: 'Route not found',
    defaultDetail: 'The requested endpoint does not exist.',
  },
  EMAIL_ALREADY_REGISTERED: {
    status: 409,
    title: 'Email already registered',
    defaultDetail: 'Another user already uses this email.',
  },
  USER_NAME_LOCKED: {
    status: 409,
    title: 'User name locked',
    defaultDetail: 'First and last name cannot be changed while the user is inactive.',
  },
  SELF_MODIFICATION_FORBIDDEN: {
    status: 409,
    title: 'Self-modification forbidden',
    defaultDetail: 'You cannot deactivate or delete your own account.',
  },
  RATE_LIMITED: {
    status: 429,
    title: 'Too many requests',
    defaultDetail: 'Too many requests. Try again later.',
  },
  INTERNAL_ERROR: {
    status: 500,
    title: 'Internal error',
    defaultDetail: 'Something went wrong on our side.',
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    title: 'Service unavailable',
    defaultDetail: 'The service is temporarily unavailable.',
  },
} as const satisfies Record<string, { status: number; title: string; defaultDetail: string }>;

export type ErrorCode = keyof typeof errorCatalog;

export const errorCodes = Object.keys(errorCatalog) as ErrorCode[];

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.hasOwn(errorCatalog, value);
}

/** URN used as the RFC 9457 `type` member, e.g. `urn:backoffice:problem:user-name-locked`. */
export function problemType(code: ErrorCode): string {
  return `urn:backoffice:problem:${code.toLowerCase().replaceAll('_', '-')}`;
}
