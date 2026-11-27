import {
  createSessionBodySchema,
  problemDetailsSchema,
  sessionIdParamsSchema,
  sessionSchema,
} from '@backoffice/contracts';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { SessionService } from '../../services/session-service.js';
import { toSessionDto } from '../mappers.js';

const problem = problemDetailsSchema;
const tags = ['sessions'];

/** Sessions API (spec 01). */
export const sessionRoutes =
  (sessions: SessionService): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    app.post(
      '/sessions',
      {
        schema: {
          tags,
          summary: 'Create a session for an active user',
          body: createSessionBodySchema,
          response: { 201: sessionSchema, 400: problem, 403: problem, 404: problem },
        },
      },
      async (request, reply) => {
        const session = await sessions.create(request.body.userId);
        return reply.status(201).send(toSessionDto(session));
      },
    );

    app.delete(
      '/sessions/:id',
      {
        schema: {
          tags,
          summary: 'Terminate a session (idempotent; the record is kept)',
          params: sessionIdParamsSchema,
          response: { 204: z.null(), 400: problem, 404: problem },
        },
      },
      async (request, reply) => {
        await sessions.terminate(request.params.id);
        return reply.status(204).send(null);
      },
    );

    done();
  };
