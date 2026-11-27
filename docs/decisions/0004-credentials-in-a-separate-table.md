# 0004. Credentials in a separate table, added by migration

- Status: Accepted
- Date: 2026-11-27

## Context

The User domain in the requirements has no credentials, yet Part 1 introduces sign-up and sign-in with
a password. Two questions follow: where the password hash lives, and when it enters the schema.

## Decision

- `email` is a user attribute (shown in the dashboard, used to sign in) and lives on `users`.
- The password hash lives in `user_credentials` (one row per user, cascade on delete).
- Hashing uses Node's built-in `scrypt` with a random per-user salt and a self-describing format
  (algorithm, parameters, salt, hash), compared with `timingSafeEqual`. No native dependencies.
- The schema starts in Part 0 exactly as the domain describes, and credentials arrive in Part 1
  through an expand migration, tightened by a contract migration in Part 2 (see spec 06).

## Consequences

- User queries and DTOs cannot leak the hash by accident (`SELECT *` on `users` never sees it).
- New authentication methods (OAuth, passkeys, MFA) become new tables, not new nullable columns.
- Sign-in reads two tables; with a primary-key join this costs nothing measurable.
- Users created before Part 1 cannot sign in until a password reset feature exists (documented).
