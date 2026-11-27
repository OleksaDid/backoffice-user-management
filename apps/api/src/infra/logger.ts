import { pino, type Logger } from 'pino';

import type { Config } from '../config/env.js';

/**
 * Structured JSON logger (NFR-30). Credentials never reach the logs: cookies, auth
 * headers and any password field are redacted wherever they appear.
 */
export function createLogger(config: Pick<Config, 'LOG_LEVEL' | 'LOG_PRETTY'>): Logger {
  return pino({
    level: config.LOG_LEVEL,
    base: { service: 'api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'res.headers["set-cookie"]',
        '*.password',
        '*.passwordHash',
      ],
      censor: '[REDACTED]',
    },
    ...(config.LOG_PRETTY ? { transport: { target: 'pino-pretty' } } : {}),
  });
}

export type { Logger };
