import { describe, expect, it } from 'vitest';

import { isSessionActive, sessionExpiry, type SessionEntity } from './session.js';

const now = new Date('2026-02-01T12:00:00Z');

function session(overrides: Partial<SessionEntity> = {}): SessionEntity {
  return {
    id: 's1',
    userId: 'u1',
    createdAt: now,
    expiresAt: sessionExpiry(now, 168),
    terminatedAt: null,
    ...overrides,
  };
}

describe('session lifetime', () => {
  it('expires the configured number of hours after creation', () => {
    expect(sessionExpiry(now, 168).toISOString()).toBe('2026-02-08T12:00:00.000Z');
  });

  it('is active until terminated or expired', () => {
    expect(isSessionActive(session(), now)).toBe(true);
    expect(isSessionActive(session({ terminatedAt: now }), now)).toBe(false);
    expect(isSessionActive(session({ expiresAt: now }), now)).toBe(false);
  });
});
