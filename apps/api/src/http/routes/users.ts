import {
  createUserBodySchema,
  paginatedSchema,
  paginationQuerySchema,
  problemDetailsSchema,
  updateUserProfileBodySchema,
  updateUserStatusBodySchema,
  userIdParamsSchema,
  userSchema,
} from '@backoffice/contracts';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { UserService } from '../../services/user-service.js';
import { toUserDto } from '../mappers.js';

const problem = problemDetailsSchema;
const tags = ['users'];

/** Users API (spec 01). */
export const userRoutes =
  (users: UserService): FastifyPluginCallbackZod =>
  (app, _options, done) => {
    app.get(
      '/users',
      {
        schema: {
          tags,
          summary: 'List users, newest first (paginated)',
          querystring: paginationQuerySchema,
          response: { 200: paginatedSchema(userSchema), 400: problem },
        },
      },
      async (request) => {
        const page = await users.list(request.query);
        return { ...page, items: page.items.map(toUserDto) };
      },
    );

    app.post(
      '/users',
      {
        schema: {
          tags,
          summary: 'Create a user with an initial password',
          body: createUserBodySchema,
          response: { 201: userSchema, 400: problem, 409: problem },
        },
      },
      async (request, reply) => {
        const user = await users.create(request.body);
        return reply.status(201).send(toUserDto(user));
      },
    );

    app.patch(
      '/users/:id',
      {
        schema: {
          tags,
          summary: "Update a user's first and/or last name",
          params: userIdParamsSchema,
          body: updateUserProfileBodySchema,
          response: { 200: userSchema, 400: problem, 404: problem, 409: problem },
        },
      },
      async (request) => toUserDto(await users.updateProfile(request.params.id, request.body)),
    );

    app.put(
      '/users/:id/status',
      {
        schema: {
          tags,
          summary: "Set a user's status; deactivation terminates their sessions",
          params: userIdParamsSchema,
          body: updateUserStatusBodySchema,
          response: { 200: userSchema, 400: problem, 404: problem },
        },
      },
      async (request) => toUserDto(await users.setStatus(request.params.id, request.body.status)),
    );

    app.delete(
      '/users/:id',
      {
        schema: {
          tags,
          summary: 'Delete a user and their sessions',
          params: userIdParamsSchema,
          response: { 204: z.null(), 400: problem, 404: problem },
        },
      },
      async (request, reply) => {
        await users.delete(request.params.id);
        return reply.status(204).send(null);
      },
    );

    done();
  };
