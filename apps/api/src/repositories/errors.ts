/** PostgreSQL error code for unique constraint violations. */
const UNIQUE_VIOLATION = '23505';

interface PgError {
  code?: string;
  constraint?: string;
  cause?: unknown;
}

/** True when `error` (or a wrapped cause) violates the given unique constraint. */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth++) {
    const candidate = current as PgError;
    if (candidate.code === UNIQUE_VIOLATION && candidate.constraint === constraint) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}
