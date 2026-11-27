import { z } from 'zod';

import { PASSWORD_MAX_LENGTH, emailSchema, passwordSchema } from './credentials.js';
import { sessionSchema } from './sessions.js';
import { personNameSchema, userSchema } from './users.js';

/** AUTH-01: the API receives one password; confirmation is a client-side check (UI-AUTH-04). */
export const signUpBodySchema = z.strictObject({
  firstName: personNameSchema,
  lastName: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpBody = z.infer<typeof signUpBodySchema>;

/** AUTH-03: no length rules on sign-in, so old passwords never get locked out by policy changes. */
export const signInBodySchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(PASSWORD_MAX_LENGTH),
});
export type SignInBody = z.infer<typeof signInBodySchema>;

/** AUTH-01, AUTH-03, AUTH-07, AUTH-22 */
export const authResponseSchema = z
  .object({ user: userSchema, session: sessionSchema })
  .meta({ id: 'AuthResponse' });
export type AuthResponse = z.infer<typeof authResponseSchema>;

/**
 * Sign-up form: the shared body plus the confirmation field, checked before any request
 * is sent (UI-AUTH-04). Used by the web app.
 */
export const signUpFormSchema = signUpBodySchema
  .extend({ confirmPassword: z.string() })
  .refine((form) => form.password === form.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignUpForm = z.input<typeof signUpFormSchema>;
