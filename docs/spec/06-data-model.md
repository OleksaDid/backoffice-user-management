# 06. Data model

PostgreSQL 17. The schema grows phase by phase, the way a real product evolves: each change is a
committed, forward-only SQL migration, applied automatically before the API starts.

## Migrations

| Migration               | Phase  | Kind     | Change                                                                      |
| ----------------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `0000_init`             | Part 0 | create   | `users`, `sessions`, enum `user_status`, indexes                            |
| `0001_user_credentials` | Part 1 | expand   | nullable `users.email` + unique index on `lower(email)`; `user_credentials` |
| `0002_email_required`   | Part 2 | contract | backfill legacy users without email, then `users.email NOT NULL`            |

- **DATA-01** Migrations are forward-only and immutable once merged. A fix is a new migration.
- **DATA-02** Schema changes follow **expand → migrate → contract**: a release only adds what the
  previous release can ignore, and constraints are tightened in a later release once data complies.
  Each release can roll out with zero downtime and be rolled back to the previous application image.
  At this project's data size the steps are written plainly (index built in the migration
  transaction, backfill and `NOT NULL` together). For a large table the same change would build
  the index `CONCURRENTLY` in its own migration and add a `NOT VALID` check constraint, validate
  it, and only then set `NOT NULL`, to avoid long locks.
- **DATA-03** Migrations run as a one-off step before the API starts (`migrate` service in Compose,
  the same step in deployments). The API never alters the schema at runtime.

## Tables

### `users` (after `0002`)

| Column         | Type           | Constraints                                            |
| -------------- | -------------- | ------------------------------------------------------ |
| `id`           | `uuid`         | primary key, default `gen_random_uuid()`               |
| `first_name`   | `varchar(100)` | not null                                               |
| `last_name`    | `varchar(100)` | not null                                               |
| `email`        | `varchar(254)` | not null (from `0002`); unique index on `lower(email)` |
| `status`       | `user_status`  | not null, default `active`; enum `active`, `inactive`  |
| `logins_count` | `integer`      | not null, default 0, check `>= 0`                      |
| `created_at`   | `timestamptz`  | not null, default `now()`                              |
| `updated_at`   | `timestamptz`  | not null, default `now()`                              |

Index `users_created_at_id_idx (created_at desc, id desc)` serves the paginated list (USR-05).

### `user_credentials`

| Column                | Type          | Constraints                                                        |
| --------------------- | ------------- | ------------------------------------------------------------------ |
| `user_id`             | `uuid`        | primary key, references `users(id)` on delete cascade              |
| `password_hash`       | `text`        | not null (scrypt, self-describing format with salt and parameters) |
| `password_updated_at` | `timestamptz` | not null, default `now()`                                          |

Credentials live apart from the user profile on purpose: user queries and DTOs can never include the
hash, authentication concerns stay separate from profile data, and further methods (OAuth, passkeys,
MFA) can be added without touching `users`.

### `sessions`

| Column          | Type          | Constraints                                        |
| --------------- | ------------- | -------------------------------------------------- |
| `id`            | `uuid`        | primary key, default `gen_random_uuid()`           |
| `user_id`       | `uuid`        | not null, references `users(id)` on delete cascade |
| `created_at`    | `timestamptz` | not null, default `now()`                          |
| `expires_at`    | `timestamptz` | not null                                           |
| `terminated_at` | `timestamptz` | null while not terminated                          |

Partial index `sessions_active_user_idx (user_id) where terminated_at is null` serves "terminate all
active sessions of a user" (USR-11).

## Rules enforced in the database as well as in code

- **DATA-10** `created_at` is never part of an update statement; `updated_at` is set explicitly by
  every update (USR-12).
- **DATA-11** `logins_count` is incremented with `logins_count = logins_count + 1` in SQL, inside the
  same transaction that creates the session (SES-03).
- **DATA-12** Deleting a user cascades to sessions and credentials (USR-13).

## Legacy rows in `0002`

Users created in Part 0 have no email and no credentials. `0002` gives them a placeholder
`legacy-<id>@example.invalid` (the `.invalid` TLD is reserved and can never receive mail) so the
`NOT NULL` constraint holds. They cannot sign in until a password reset feature exists, which is
listed as a future improvement.
