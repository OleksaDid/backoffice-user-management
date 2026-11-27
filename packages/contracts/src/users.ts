import { z } from 'zod';

import { emailSchema, passwordSchema } from './credentials.js';

export const userStatusSchema = z.enum(['active', 'inactive']);
export type UserStatus = z.infer<typeof userStatusSchema>;

/** First and last name: trimmed, 1 to 100 characters, never blank. */
export const personNameSchema = z
  .string()
  .trim()
  .min(1, 'Must not be blank')
  .max(100, 'Must be at most 100 characters');

export const userIdParamsSchema = z.object({ id: z.uuid() });

/** User as returned by the API (spec 01, User). */
export const userSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    /** Null only for users created before credentials existed (spec 06, legacy rows). */
    email: z.string().nullable(),
    status: userStatusSchema,
    loginsCount: z.number().int().min(0),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'User' });
export type User = z.infer<typeof userSchema>;

/** USR-01, USR-02, AUTH-12: unknown and read-only fields are rejected; every user can sign in. */
export const createUserBodySchema = z.strictObject({
  firstName: personNameSchema,
  lastName: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
  status: userStatusSchema.optional(),
});
export type CreateUserBody = z.infer<typeof createUserBodySchema>;

/** USR-07, USR-08: profile fields only, both required. */
export const updateUserProfileBodySchema = z.strictObject({
  firstName: personNameSchema,
  lastName: personNameSchema,
});
export type UpdateUserProfileBody = z.infer<typeof updateUserProfileBodySchema>;

/** USR-10: status has its own endpoint. */
export const updateUserStatusBodySchema = z.strictObject({ status: userStatusSchema });
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusBodySchema>;
