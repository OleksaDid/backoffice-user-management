import { problemDetailsSchema, sessionIdParamsSchema } from '@backoffice/contracts';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { AuthService } from '../../services/auth-service.js';
import type { SessionService } from '../../services/session-service.js';
import { authOf, requireAuth } from '../auth.js';
import { clearSessionCookie, type CookieSettings } from '../session-cookie.js';

const problem = problemDetailsSchema;
const tags = ['sessions'];

/**
 * Sessions API (spec 01). Sessions are created only by sign-up and sign-in (AUTH-09):
 * creating one for an arbitrary user id would allow impersonation.
 */
export const sessionRoutes =
  (
    sessions: SessionService,
    auth: AuthService,
    cookies: CookieSettings,
  ): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    // Before validation: anonymous requests get 401, never schema details.
    app.addHook('preValidation', requireAuth(auth));

    app.delete(
      '/sessions/:id',
      {
        schema: {
          tags,
          summary: 'Terminate a session (idempotent; the record is kept)',
          params: sessionIdParamsSchema,
          response: { 204: z.null(), 400: problem, 401: problem, 404: problem },
        },
      },
      async (request, reply) => {
        await sessions.terminate(request.params.id);
        // Ending one's own current session is the same as signing out (AUTH-09).
        if (request.params.id === authOf(request).session.id) {
          clearSessionCookie(reply, cookies);
        }
        return reply.status(204).send(null);
      },
    );

    done();
  };
