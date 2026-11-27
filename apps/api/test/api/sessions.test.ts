import { describe, it } from 'vitest';

// Spec 01, sessions API. Scaffolding from the spec; each todo becomes a real test
// together with the implementation.
describe('sessions API (integration)', () => {
  it.todo('SES-01 creates a session for an active user');
  it.todo('SES-02 rejects inactive and unknown users');
  it.todo('SES-03 increments loginsCount atomically and never decreases it');
  it.todo('SES-04 terminates a session and keeps the record');
  it.todo('SES-05 terminating again is idempotent');
  it.todo('SES-06 answers 404 for unknown sessions');
});
