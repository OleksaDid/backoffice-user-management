import { errorCatalog, type ErrorCode, type FieldError } from '@backoffice/contracts';

export interface AppErrorOptions {
  /** Human-readable explanation for this occurrence; defaults to the catalog message. */
  detail?: string;
  /** Field-level problems, used by VALIDATION_FAILED. */
  errors?: FieldError[];
  cause?: unknown;
}

/**
 * Base class for every expected failure (ERR-10). Domain and service code throw these;
 * only the central error handler turns them into HTTP responses.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly detail: string;
  readonly errors: FieldError[] | undefined;

  constructor(code: ErrorCode, options: AppErrorOptions = {}) {
    const entry = errorCatalog[code];
    const detail = options.detail ?? entry.defaultDetail;
    super(detail, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = entry.status;
    this.detail = detail;
    this.errors = options.errors;
  }

  /** Expected client errors are logged, not reported as incidents (ERR-12). */
  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
