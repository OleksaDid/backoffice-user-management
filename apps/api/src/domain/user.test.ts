import { describe, expect, it } from 'vitest';

import { AppError } from '../errors/app-error.js';
import {
  assertCanStartSession,
  assertNotSelf,
  endsSessions,
  profileChanges,
  statusChanges,
  type UserEntity,
} from './user.js';

const created = new Date('2026-01-01T00:00:00Z');
const now = new Date('2026-02-01T12:00:00Z');

function user(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'u1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    status: 'active',
    loginsCount: 0,
    createdAt: created,
    updatedAt: created,
    ...overrides,
  };
}

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
    return undefined;
  } catch (error) {
    return error instanceof AppError ? error.code : 'not an AppError';
  }
}

describe('profile changes', () => {
  it('USR-07 applies the patch and USR-12 refreshes updatedAt', () => {
    expect(profileChanges(user(), { firstName: 'Augusta' }, now)).toEqual({
      firstName: 'Augusta',
      updatedAt: now,
    });
  });

  it('USR-12 never touches createdAt', () => {
    expect(profileChanges(user(), { lastName: 'King' }, now)).not.toHaveProperty('createdAt');
  });

  it('USR-09 locks names while the user is inactive', () => {
    expect(
      codeOf(() => profileChanges(user({ status: 'inactive' }), { firstName: 'X' }, now)),
    ).toBe('USER_NAME_LOCKED');
  });
});

describe('status changes', () => {
  it('USR-10 sets the status and USR-12 refreshes updatedAt, also when unchanged', () => {
    expect(statusChanges('active', now)).toEqual({ status: 'active', updatedAt: now });
  });

  it('USR-11 deactivation ends sessions, activation does not', () => {
    expect(endsSessions(statusChanges('inactive', now))).toBe(true);
    expect(endsSessions(statusChanges('active', now))).toBe(false);
  });
});

describe('starting a session', () => {
  it('SES-01 allows active users', () => {
    expect(
      codeOf(() => {
        assertCanStartSession(user());
      }),
    ).toBeUndefined();
  });

  it('SES-02 rejects inactive users', () => {
    expect(
      codeOf(() => {
        assertCanStartSession(user({ status: 'inactive' }));
      }),
    ).toBe('USER_INACTIVE');
  });
});

describe('self-management', () => {
  it('AUTH-30 forbids acting on your own account and allows others', () => {
    expect(
      codeOf(() => {
        assertNotSelf('u1', 'u1');
      }),
    ).toBe('SELF_MODIFICATION_FORBIDDEN');
    expect(
      codeOf(() => {
        assertNotSelf('u1', 'u2');
      }),
    ).toBeUndefined();
  });
});
