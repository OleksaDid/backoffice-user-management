import { describe, expect, it } from 'vitest';

import { errorCatalog, errorCodes, isErrorCode, problemType } from './catalog.js';

describe('error catalog', () => {
  it('ERR-02 every code maps to an HTTP error status', () => {
    for (const code of errorCodes) {
      const { status } = errorCatalog[code];
      expect(status, code).toBeGreaterThanOrEqual(400);
      expect(status, code).toBeLessThan(600);
    }
  });

  it('ERR-01 conflicts use 409, invalid requests use 400', () => {
    expect(errorCatalog.EMAIL_ALREADY_REGISTERED.status).toBe(409);
    expect(errorCatalog.USER_NAME_LOCKED.status).toBe(409);
    expect(errorCatalog.SELF_MODIFICATION_FORBIDDEN.status).toBe(409);
    expect(errorCatalog.VALIDATION_FAILED.status).toBe(400);
  });

  it('ERR-01 builds a stable problem type URN from the code', () => {
    expect(problemType('USER_NAME_LOCKED')).toBe('urn:backoffice:problem:user-name-locked');
  });

  it('recognises catalog codes only', () => {
    expect(isErrorCode('USER_NOT_FOUND')).toBe(true);
    expect(isErrorCode('toString')).toBe(false);
    expect(isErrorCode(42)).toBe(false);
  });
});
