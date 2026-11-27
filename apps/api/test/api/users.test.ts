import { describe, it } from 'vitest';

// Spec 01, users API. Scaffolding from the spec; each todo becomes a real test
// together with the implementation.
describe('users API (integration)', () => {
  it.todo('USR-01 creates a user with zero logins and updatedAt equal to createdAt');
  it.todo('USR-02 rejects unknown and read-only fields');
  it.todo('USR-03 returns a page with totals');
  it.todo('USR-04 defaults to 6 per page and validates page parameters');
  it.todo('USR-05 orders users newest first with a stable tie-breaker');
  it.todo('USR-06 returns an empty page beyond the last one');
  it.todo('USR-07 updates first and last name');
  it.todo('USR-08 rejects status and read-only fields in profile updates');
  it.todo('USR-09 rejects name changes for inactive users');
  it.todo('USR-10 sets the status, idempotently');
  it.todo('USR-11 deactivation terminates active sessions');
  it.todo('USR-12 every update refreshes updatedAt and keeps createdAt');
  it.todo('USR-13 deletes the user and their sessions');
  it.todo('USR-14 answers 404 for unknown and 400 for malformed ids');
});
