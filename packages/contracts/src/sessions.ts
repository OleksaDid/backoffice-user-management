import { z } from 'zod';

export const sessionIdParamsSchema = z.object({ id: z.uuid() });

/** Session as returned by the API (spec 01, Session). */
export const sessionSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    createdAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
    terminatedAt: z.iso.datetime().nullable(),
  })
  .meta({ id: 'Session' });
export type Session = z.infer<typeof sessionSchema>;

/** SES-01 (Part 0 only; removed by AUTH-09). */
export const createSessionBodySchema = z.strictObject({ userId: z.uuid() });
export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;
