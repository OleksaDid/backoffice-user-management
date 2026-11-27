import { z } from 'zod';

/** AUTH-10: valid, at most 254 characters, compared and stored lower-cased. */
export const emailSchema = z
  .string()
  .trim()
  .max(254, 'Must be at most 254 characters')
  .pipe(z.email('Enter a valid email address'))
  .transform((email) => email.toLowerCase());

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** AUTH-11: 8 to 128 characters, no composition rules (NIST SP 800-63B). */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Must be at most ${PASSWORD_MAX_LENGTH} characters`);
