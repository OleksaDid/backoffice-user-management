import type { FieldError } from '@backoffice/contracts';
import type { FastifyError, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

import { AppError, isAppError } from '../errors/app-error.js';
import type { ErrorReporter } from '../infra/error-reporter.js';
import { sendProblem } from './problem.js';
import type { App } from './types.js';

/** Converts schema validation issues into `{ path, message }` field errors. */
function toFieldErrors(
  validation: { instancePath: string; message?: string; params: Record<string, unknown> }[],
  context: string | undefined,
): FieldError[] {
  return validation.flatMap((issue) => {
    const base = issue.instancePath.replace(/^\//, '').replaceAll('/', '.');
    const keys = issue.params.keys;
    // Unknown fields are reported once per key, so clients can point at each of them.
    if (Array.isArray(keys) && keys.length > 0) {
      return keys.map((key) => ({
        path: base ? `${base}.${String(key)}` : String(key),
        message: 'Unknown field',
      }));
    }
    return [{ path: base || (context ?? ''), message: issue.message ?? 'Invalid value' }];
  });
}

/** Maps anything thrown inside a request to an AppError (ERR-11). */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (hasZodFastifySchemaValidationErrors(error)) {
    return new AppError('VALIDATION_FAILED', {
      errors: toFieldErrors(error.validation, error.validationContext),
      cause: error,
    });
  }
  const statusCode = (error as Partial<FastifyError> | null)?.statusCode;
  if (statusCode === 429) {
    return new AppError('RATE_LIMITED', { cause: error });
  }
  // Framework client errors: malformed JSON, unsupported media type, body too large.
  if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
    return new AppError('VALIDATION_FAILED', {
      detail: (error as FastifyError).message,
      cause: error,
    });
  }
  // Anything else is unexpected; its message may leak internals, so it is not exposed.
  return new AppError('INTERNAL_ERROR', { cause: error });
}

function contextOf(request: FastifyRequest) {
  return {
    source: 'request' as const,
    requestId: request.id,
    method: request.method,
    route: request.routeOptions.url ?? request.url,
  };
}

/**
 * Central HTTP error handling (ERR-11, ERR-14): one place converts errors to problem
 * details and reports them. Unknown errors become a generic 500 without internals.
 */
export function registerErrorHandling(app: App, reporter: ErrorReporter): void {
  app.setErrorHandler((error, request, reply) => {
    const appError = toAppError(error);
    reporter.report(appError.code === 'INTERNAL_ERROR' ? error : appError, contextOf(request));
    return sendProblem(reply, appError);
  });

  app.setNotFoundHandler((request, reply) => {
    return sendProblem(
      reply,
      new AppError('ROUTE_NOT_FOUND', { detail: `No route for ${request.method} ${request.url}.` }),
    );
  });
}
