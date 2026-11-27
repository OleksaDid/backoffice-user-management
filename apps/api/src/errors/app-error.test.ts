import { describe, expect, it } from 'vitest';

import { AppError, isAppError } from './app-error.js';

describe('AppError', () => {
  it('ERR-10 takes status and default detail from the catalog', () => {
    const error = new AppError('USER_NAME_LOCKED');
    expect(error.status).toBe(409);
    expect(error.detail).toBe('First and last name cannot be changed while the user is inactive.');
    expect(error.isServerError).toBe(false);
    expect(isAppError(error)).toBe(true);
  });

  it('ERR-10 accepts a specific detail, field errors and a cause', () => {
    const cause = new Error('db');
    const error = new AppError('VALIDATION_FAILED', {
      detail: 'Bad input',
      errors: [{ path: 'firstName', message: 'Required' }],
      cause,
    });
    expect(error.message).toBe('Bad input');
    expect(error.errors).toEqual([{ path: 'firstName', message: 'Required' }]);
    expect(error.cause).toBe(cause);
  });

  it('does not treat plain errors as application errors', () => {
    expect(isAppError(new Error('x'))).toBe(false);
  });
});
