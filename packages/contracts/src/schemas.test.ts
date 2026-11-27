import { describe, expect, it } from 'vitest';

import { paginationQuerySchema, totalPages } from './pagination.js';
import { createSessionBodySchema } from './sessions.js';
import {
  createUserBodySchema,
  createUserFormSchema,
  updateUserProfileBodySchema,
  updateUserStatusBodySchema,
} from './users.js';

describe('user schemas', () => {
  it('USR-01 AUTH-12 trims names, normalises the email and requires a password', () => {
    expect(
      createUserBodySchema.parse({
        firstName: '  Ada ',
        lastName: 'Lovelace',
        email: 'Ada@Example.com',
        password: 'long enough',
      }),
    ).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'long enough',
    });
    expect(createUserBodySchema.safeParse({ firstName: 'Ada', lastName: 'L' }).success).toBe(false);
  });

  it('USR-02 rejects blank, too long and read-only fields', () => {
    const valid = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'long enough',
    };
    expect(createUserBodySchema.safeParse(valid).success).toBe(true);
    expect(createUserBodySchema.safeParse({ ...valid, firstName: '   ' }).success).toBe(false);
    expect(createUserBodySchema.safeParse({ ...valid, lastName: 'a'.repeat(101) }).success).toBe(
      false,
    );
    expect(createUserBodySchema.safeParse({ ...valid, loginsCount: 3 }).success).toBe(false);
  });

  it('USR-07 USR-08 accepts profile fields only and requires both names', () => {
    expect(
      updateUserProfileBodySchema.safeParse({ firstName: 'Ada', lastName: 'King' }).success,
    ).toBe(true);
    expect(updateUserProfileBodySchema.safeParse({ firstName: 'Ada' }).success).toBe(false);
    expect(updateUserProfileBodySchema.safeParse({ lastName: 'King' }).success).toBe(false);
    expect(updateUserProfileBodySchema.safeParse({}).success).toBe(false);
    expect(updateUserProfileBodySchema.safeParse({ status: 'inactive' }).success).toBe(false);
    expect(
      updateUserProfileBodySchema.safeParse({
        firstName: 'Ada',
        lastName: 'King',
        createdAt: '2020-01-01',
      }).success,
    ).toBe(false);
  });

  it('USR-10 accepts only a known status', () => {
    expect(updateUserStatusBodySchema.safeParse({ status: 'inactive' }).success).toBe(true);
    expect(updateUserStatusBodySchema.safeParse({ status: 'banned' }).success).toBe(false);
  });
});

describe('pagination', () => {
  it('USR-04 defaults to page 1 with 6 items', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 6 });
  });

  it('USR-04 coerces query strings and enforces bounds', () => {
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '10' })).toEqual({
      page: 3,
      pageSize: 10,
    });
    expect(paginationQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: '1.5' }).success).toBe(false);
  });

  it('USR-06 computes total pages, 0 when empty', () => {
    expect(totalPages(0, 6)).toBe(0);
    expect(totalPages(6, 6)).toBe(1);
    expect(totalPages(7, 6)).toBe(2);
  });
});

describe('session schemas', () => {
  it('SES-01 requires a user id as UUID', () => {
    expect(
      createSessionBodySchema.safeParse({ userId: '0b9f4c1e-5d6a-4c55-9c33-6e0f2f2d9a11' }).success,
    ).toBe(true);
    expect(createSessionBodySchema.safeParse({ userId: 'nope' }).success).toBe(false);
  });
});

describe('create-user form', () => {
  it('DASH-20 checks the password confirmation on the confirmation field', () => {
    const form = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'correct horse',
    };
    const mismatch = createUserFormSchema.safeParse({ ...form, confirmPassword: 'other one' });
    expect(mismatch.error?.issues[0]?.path).toEqual(['confirmPassword']);
    expect(
      createUserFormSchema.safeParse({ ...form, confirmPassword: form.password }).success,
    ).toBe(true);
  });
});
