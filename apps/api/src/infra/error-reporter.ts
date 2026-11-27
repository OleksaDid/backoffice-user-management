import type { Logger } from 'pino';

import { isAppError } from '../errors/app-error.js';

export interface ErrorContext {
  /** Where the error surfaced. */
  source: 'request' | 'process';
  requestId?: string;
  method?: string;
  route?: string;
  userId?: string;
}

/**
 * Single sink for errors (ERR-12). Call sites depend on this interface only, so the
 * default log-based implementation can be swapped for Sentry or similar without
 * touching them.
 */
export interface ErrorReporter {
  report(error: unknown, context: ErrorContext): void;
}

/** Default reporter: unexpected errors at `error` level, expected client errors at `info`. */
export class LoggerErrorReporter implements ErrorReporter {
  constructor(private readonly logger: Logger) {}

  report(error: unknown, context: ErrorContext): void {
    if (isAppError(error) && !error.isServerError) {
      this.logger.info({ ...context, code: error.code, status: error.status }, error.detail);
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.error({ ...context, err }, err.message);
  }
}
