import { z } from 'zod';

/** Page size used by the dashboard (DASH-11). */
export const DEFAULT_PAGE_SIZE = 6;
export const MAX_PAGE_SIZE = 100;

/** USR-04: `page` ≥ 1, `pageSize` 1..100, both optional with defaults. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** USR-03: one page of items plus the totals needed to render pagination. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalItems: z.number().int(),
    totalPages: z.number().int(),
  });
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function totalPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}
