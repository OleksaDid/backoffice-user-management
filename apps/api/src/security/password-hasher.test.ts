import { describe, expect, it } from 'vitest';

import { PasswordHasher } from './password-hasher.js';

// Low cost keeps unit tests fast; production uses DEFAULT_SCRYPT.
const hasher = new PasswordHasher({ N: 2 ** 10, r: 8, p: 1 });

describe('PasswordHasher', () => {
  it('AUTH-11 NFR-10 stores a salted, self-describing hash, never the password', async () => {
    const hash = await hasher.hash('correct horse');
    expect(hash).toMatch(/^scrypt\$1024\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(hash).not.toContain('correct horse');
    expect(await hasher.hash('correct horse')).not.toBe(hash);
  });

  it('AUTH-04 NFR-10 verifies the right password and rejects a wrong one', async () => {
    const hash = await hasher.hash('correct horse');
    expect(await hasher.verify('correct horse', hash)).toBe(true);
    expect(await hasher.verify('correct horsE', hash)).toBe(false);
  });

  it('verifies hashes made with other parameters', async () => {
    const stronger = new PasswordHasher({ N: 2 ** 11, r: 8, p: 1 });
    expect(await hasher.verify('pw-12345', await stronger.hash('pw-12345'))).toBe(true);
  });

  it('never verifies malformed hashes', async () => {
    for (const encoded of ['', 'plain', 'bcrypt$1$2$3$4$5', 'scrypt$x$8$1$abc$def']) {
      expect(await hasher.verify('anything', encoded)).toBe(false);
    }
  });

  it('AUTH-04 the dummy verification always fails', async () => {
    expect(await hasher.verifyAgainstDummy('anything')).toBe(false);
  });
});
