import type { Database } from '../db/client.js';

/** Either the pooled database or an open transaction; repositories work with both. */
export type Executor = Database | Parameters<Parameters<Database['transaction']>[0]>[0];
