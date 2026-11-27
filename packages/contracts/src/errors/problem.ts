import { z } from 'zod';

import { errorCodes } from './catalog.js';

/** One invalid field in a VALIDATION_FAILED response. */
export const fieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
});

/** RFC 9457 problem details with the extensions described in spec 05 (ERR-01). */
export const problemDetailsSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    code: z.enum(errorCodes as [string, ...string[]]),
    detail: z.string(),
    requestId: z.string().optional(),
    errors: z.array(fieldErrorSchema).optional(),
  })
  .meta({ id: 'ProblemDetails' });

export type FieldError = z.infer<typeof fieldErrorSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
