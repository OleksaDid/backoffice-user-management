import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from './schema.js';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  pool: pg.Pool;
  close: () => Promise<void>;
}

export interface DatabaseOptions {
  url: string;
  poolMax: number;
  /**
   * Called when an idle pooled connection fails (for example when PostgreSQL restarts).
   * Without a listener, pg emits an unhandled 'error' event that would crash the process.
   */
  onIdleClientError?: (error: Error) => void;
}

export function createDatabase(options: DatabaseOptions): DatabaseHandle {
  const pool = new pg.Pool({
    connectionString: options.url,
    max: options.poolMax,
    // Fail fast instead of queueing requests forever when the database is down.
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  pool.on('error', options.onIdleClientError ?? (() => undefined));
  const db = drizzle(pool, { schema, casing: 'snake_case' });
  return { db, pool, close: () => pool.end() };
}
