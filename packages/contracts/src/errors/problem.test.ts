import { describe, expect, it } from 'vitest';

import { problemDetailsSchema } from './problem.js';

const problem = {
  type: 'urn:backoffice:problem:validation-failed',
  title: 'Validation failed',
  status: 400,
  code: 'VALIDATION_FAILED',
  detail: 'The request contains invalid data.',
};

describe('problem details schema', () => {
  it('ERR-01 accepts problem details with field errors and a request id', () => {
    expect(
      problemDetailsSchema.safeParse({
        ...problem,
        requestId: 'r-1',
        errors: [{ path: 'email', message: 'Invalid email' }],
      }).success,
    ).toBe(true);
  });

  it('ERR-02 only accepts codes from the catalog', () => {
    expect(problemDetailsSchema.safeParse({ ...problem, code: 'SOMETHING_ELSE' }).success).toBe(
      false,
    );
  });
});
