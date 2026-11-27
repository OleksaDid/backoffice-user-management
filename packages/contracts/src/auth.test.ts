import { describe, expect, it } from 'vitest';

import { signInBodySchema, signUpBodySchema, signUpFormSchema } from './auth.js';
import { emailSchema, passwordSchema } from './credentials.js';

const signUp = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  password: 'correct horse',
};

describe('credential schemas', () => {
  it('AUTH-10 normalises emails to lower case and rejects invalid ones', () => {
    expect(emailSchema.parse('  Ada@Example.COM ')).toBe('ada@example.com');
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
    expect(emailSchema.safeParse(`${'a'.repeat(250)}@x.io`).success).toBe(false);
  });

  it('AUTH-11 accepts 8 to 128 characters without composition rules', () => {
    expect(passwordSchema.safeParse('aaaaaaaa').success).toBe(true);
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('a'.repeat(129)).success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('AUTH-01 accepts a valid sign-up and rejects the confirmation field', () => {
    expect(signUpBodySchema.safeParse(signUp).success).toBe(true);
    expect(
      signUpBodySchema.safeParse({ ...signUp, confirmPassword: signUp.password }).success,
    ).toBe(false);
  });

  it('AUTH-03 sign-in needs an email and a non-empty password', () => {
    expect(signInBodySchema.safeParse({ email: 'a@b.io', password: 'x' }).success).toBe(true);
    expect(signInBodySchema.safeParse({ email: 'a@b.io', password: '' }).success).toBe(false);
  });

  it('UI-AUTH-04 flags mismatched passwords on the confirmation field', () => {
    const result = signUpFormSchema.safeParse({ ...signUp, confirmPassword: 'battery staple' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
    expect(
      signUpFormSchema.safeParse({ ...signUp, confirmPassword: signUp.password }).success,
    ).toBe(true);
  });
});
