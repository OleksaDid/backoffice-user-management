import type { IncomingMessage, Server, ServerResponse } from 'node:http';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { Logger } from 'pino';

/** The Fastify instance type used across the API: HTTP/1.1, pino logger, zod schemas. */
export type App = FastifyInstance<Server, IncomingMessage, ServerResponse, Logger, ZodTypeProvider>;
