import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

import { AppError } from '../errors/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * AUTH-21: defence in depth on top of SameSite=Strict cookies. A state-changing request
 * is rejected when the browser says it comes from another site: an Origin header that
 * is not the public origin, or Sec-Fetch-Site: cross-site. Requests without these
 * headers (non-browser clients) cannot carry a victim's cookies and pass.
 */
export function csrfGuard(publicOrigin: string) {
  return (request: FastifyRequest, _reply: FastifyReply, done: HookHandlerDoneFunction): void => {
    const origin = request.headers.origin;
    const fetchSite = request.headers['sec-fetch-site'];
    const crossSite =
      (origin !== undefined && origin !== publicOrigin) || fetchSite === 'cross-site';
    done(
      !SAFE_METHODS.has(request.method) && crossSite ? new AppError('CSRF_REJECTED') : undefined,
    );
  };
}
