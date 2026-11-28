import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import './zod-config';

describe('zod configuration', () => {
  it('NFR-12 never probes for eval, which the CSP blocks', () => {
    expect(z.config().jitless).toBe(true);
  });
});
