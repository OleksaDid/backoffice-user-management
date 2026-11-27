import {
  randomBytes,
  scrypt as scryptCallback,
  type ScryptOptions,
  timingSafeEqual,
} from 'node:crypto';

function scrypt(password: string, salt: Buffer, length: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
}

export interface ScryptParameters {
  /** CPU/memory cost, a power of two. */
  N: number;
  r: number;
  p: number;
}

/** 2^15 × 8 × 128 bytes = 32 MiB per hash: memory-hard, still fast enough per sign-in. */
export const DEFAULT_SCRYPT: ScryptParameters = { N: 2 ** 15, r: 8, p: 1 };

const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const PREFIX = 'scrypt';

/**
 * Password hashing with Node's built-in scrypt (ADR 0004, AUTH-11), no native modules.
 * Hashes are self-describing (`scrypt$N$r$p$salt$hash`, base64url), so parameters can
 * be raised later while old hashes still verify.
 */
export class PasswordHasher {
  private readonly dummyHash: Promise<string>;

  constructor(private readonly params: ScryptParameters = DEFAULT_SCRYPT) {
    this.dummyHash = this.hash(randomBytes(16).toString('hex'));
  }

  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await scrypt(password, salt, KEY_LENGTH, this.options(this.params));
    const { N, r, p } = this.params;
    return [PREFIX, N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$');
  }

  /** Constant-time comparison; malformed hashes never verify. */
  async verify(password: string, encoded: string): Promise<boolean> {
    const parts = encoded.split('$');
    if (parts.length !== 6 || parts[0] !== PREFIX) {
      return false;
    }
    const [, n, r, p, saltText, keyText] = parts as [
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    const params = { N: Number(n), r: Number(r), p: Number(p) };
    if (![params.N, params.r, params.p].every((value) => Number.isInteger(value) && value > 0)) {
      return false;
    }
    const expected = Buffer.from(keyText, 'base64url');
    const actual = await scrypt(
      password,
      Buffer.from(saltText, 'base64url'),
      expected.length,
      this.options(params),
    );
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  /**
   * AUTH-04: spends the same time as a real verification when the email is unknown, so
   * response timing does not reveal whether an account exists.
   */
  async verifyAgainstDummy(password: string): Promise<false> {
    await this.verify(password, await this.dummyHash);
    return false;
  }

  private options({ N, r, p }: ScryptParameters): ScryptOptions {
    return { N, r, p, maxmem: 256 * N * r };
  }
}
