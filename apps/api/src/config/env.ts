import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

/**
 * Environment configuration, validated once at startup (NFR-15). The process refuses to
 * start with invalid configuration instead of failing later at an arbitrary request.
 * Every variable is documented in .env.example and deploy/README.md.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_PRETTY: booleanString.default(false),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  /** Number of reverse proxies in front of the API whose X-Forwarded-* headers are trusted. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60_000).default(10_000),
  /**
   * AUTH-21: the origin the browser app is served from. State-changing requests from any
   * other origin are rejected. Required in production.
   */
  PUBLIC_ORIGIN: z.url().optional(),
  /** AUTH-20: send the session cookie only over HTTPS. Disable only for plain-HTTP local runs. */
  COOKIE_SECURE: booleanString.default(true),
  /** Git commit of the running image (set at build time); lets deployments verify rollout. */
  APP_REVISION: z.string().min(1).default('dev'),
  /** AUTH-40: sign-in and sign-up attempts per client IP and minute. */
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(10_000).default(10),
  /** Absolute session lifetime (spec 01, Session). */
  SESSION_TTL_HOURS: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 90)
    .default(168),
});

/** Development fallback: the Compose stack's web server. */
const DEFAULT_PUBLIC_ORIGIN = 'http://localhost:8080';

export type Config = Omit<z.infer<typeof envSchema>, 'PUBLIC_ORIGIN'> & { PUBLIC_ORIGIN: string };

export class ConfigError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    // Report variable names and problems only; values may be secrets.
    throw new ConfigError(
      result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    );
  }
  const { PUBLIC_ORIGIN, ...rest } = result.data;
  if (rest.NODE_ENV === 'production') {
    const problems = [
      ...(PUBLIC_ORIGIN ? [] : ['PUBLIC_ORIGIN: required in production']),
      // AUTH-20: Secure may be disabled only for local plain-HTTP development.
      ...(rest.COOKIE_SECURE ? [] : ['COOKIE_SECURE: must be true in production']),
    ];
    if (problems.length > 0) {
      throw new ConfigError(problems);
    }
  }
  // Origins never end with a slash; normalise so the comparison is exact.
  return { ...rest, PUBLIC_ORIGIN: new URL(PUBLIC_ORIGIN ?? DEFAULT_PUBLIC_ORIGIN).origin };
}
