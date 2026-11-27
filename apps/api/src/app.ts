import { randomUUID } from 'node:crypto';

import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Logger } from 'pino';

import type { Config } from './config/env.js';
import { AppError } from './errors/app-error.js';
import { csrfGuard } from './http/csrf.js';
import { registerErrorHandling } from './http/error-handler.js';
import { authRoutes } from './http/routes/auth.js';
import { healthRoutes, type ReadinessProbe } from './http/routes/health.js';
import { sessionRoutes } from './http/routes/sessions.js';
import { userRoutes } from './http/routes/users.js';
import type { App } from './http/types.js';
import type { ErrorReporter } from './infra/error-reporter.js';
import type { AuthService } from './services/auth-service.js';
import { type Clock, systemClock } from './services/clock.js';
import type { SessionService } from './services/session-service.js';
import type { UserService } from './services/user-service.js';

export const API_PREFIX = '/api';

export interface AppDependencies {
  config: Pick<
    Config,
    | 'NODE_ENV'
    | 'TRUST_PROXY_HOPS'
    | 'COOKIE_SECURE'
    | 'PUBLIC_ORIGIN'
    | 'AUTH_RATE_LIMIT_PER_MINUTE'
  >;
  logger: Logger;
  errorReporter: ErrorReporter;
  readinessProbe: ReadinessProbe;
  services: {
    users: UserService;
    sessions: SessionService;
    auth: AuthService;
  };
  /** Defaults to the system clock; tests pass a controllable one. */
  clock?: Clock;
}

const REQUEST_ID_PATTERN = /^[\w-]{8,128}$/;

/**
 * Composition root for the HTTP layer. Everything the app needs is passed in, so tests
 * can build it with fakes and production wires real implementations in main.ts.
 */
export async function buildApp(deps: AppDependencies): Promise<App> {
  const app = Fastify({
    loggerInstance: deps.logger,
    // Trust X-Forwarded-* only from the configured number of proxies (the web server).
    trustProxy: (_address, hop) => hop < deps.config.TRUST_PROXY_HOPS,
    // Reuse a well-formed incoming request id (from the proxy), otherwise create one.
    genReqId: (request) => {
      const incoming = request.headers['x-request-id'];
      return typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming)
        ? incoming
        : randomUUID();
    },
    bodyLimit: 64 * 1024,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
    // API responses are per-user and must never be cached by proxies or the browser.
    if (!reply.hasHeader('cache-control')) {
      reply.header('cache-control', 'no-store');
    }
  });

  await app.register(cookie);
  app.addHook('onRequest', csrfGuard(deps.config.PUBLIC_ORIGIN));
  app.decorateRequest('auth', null);

  // JSON API: the HTML security policy is set by the web server; keep the other headers.
  await app.register(helmet, { contentSecurityPolicy: false, global: true });

  registerErrorHandling(app, deps.errorReporter);

  // AUTH-40: opt-in per route (sign-in, sign-up); keyed by client IP behind the proxy.
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (_request, context) =>
      new AppError('RATE_LIMITED', {
        detail: `Too many attempts. Try again in ${context.after}.`,
      }),
  });

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Back-office User Management API',
        version: '0.0.0',
        description: 'Users, sessions and authentication. Errors use RFC 9457 problem details.',
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: `${API_PREFIX}/docs` });

  await app.register(healthRoutes(deps.readinessProbe), { prefix: API_PREFIX });
  const cookies = { secure: deps.config.COOKIE_SECURE };
  const { auth, users, sessions } = deps.services;
  await app.register(
    authRoutes(auth, cookies, deps.clock ?? systemClock, deps.config.AUTH_RATE_LIMIT_PER_MINUTE),
    { prefix: API_PREFIX },
  );
  await app.register(userRoutes(users, auth), { prefix: API_PREFIX });
  await app.register(sessionRoutes(sessions, auth, cookies), { prefix: API_PREFIX });

  return app;
}
