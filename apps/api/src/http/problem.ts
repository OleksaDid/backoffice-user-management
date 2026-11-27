import { problemType, type ProblemDetails } from '@backoffice/contracts';
import { errorCatalog } from '@backoffice/contracts';
import type { FastifyReply } from 'fastify';

import type { AppError } from '../errors/app-error.js';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json; charset=utf-8';

/** Builds an RFC 9457 problem details body from an application error (ERR-01). */
export function toProblem(error: AppError, requestId: string): ProblemDetails {
  return {
    type: problemType(error.code),
    title: errorCatalog[error.code].title,
    status: error.status,
    code: error.code,
    detail: error.detail,
    requestId,
    ...(error.errors ? { errors: error.errors } : {}),
  };
}

export function sendProblem(reply: FastifyReply, error: AppError): FastifyReply {
  return reply
    .status(error.status)
    .type(PROBLEM_CONTENT_TYPE)
    .send(toProblem(error, reply.request.id));
}
