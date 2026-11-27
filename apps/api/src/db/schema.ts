import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Database schema (spec 06). It starts exactly as the Part 0 domain describes; later
 * phases extend it through new migrations, never by editing applied ones (DATA-01).
 */
export const userStatus = pgEnum('user_status', ['active', 'inactive']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
};

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    // Expand step (0001): nullable so Part 0 rows and images keep working; required in 0002.
    email: varchar('email', { length: 254 }),
    status: userStatus('status').notNull().default('active'),
    loginsCount: integer('logins_count').notNull().default(0),
    ...timestamps,
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    // Serves the paginated list ordered by newest first (USR-05, NFR-40).
    index('users_created_at_id_idx').on(table.createdAt.desc(), table.id.desc()),
    check('users_logins_count_non_negative', sql`${table.loginsCount} >= 0`),
    // AUTH-10: unique regardless of case.
    uniqueIndex('users_email_lower_unique').on(sql`lower(${table.email})`),
  ],
);

/**
 * Credentials live apart from the profile (ADR 0004): user queries can never select the
 * hash, and further sign-in methods become new tables instead of nullable columns.
 */
export const userCredentials = pgTable('user_credentials', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  passwordUpdatedAt: timestamp('password_updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    terminatedAt: timestamp('terminated_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    // Serves "terminate all active sessions of a user" (USR-11).
    index('sessions_active_user_idx')
      .on(table.userId)
      .where(sql`${table.terminatedAt} is null`),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type UserCredentialsRow = typeof userCredentials.$inferSelect;
