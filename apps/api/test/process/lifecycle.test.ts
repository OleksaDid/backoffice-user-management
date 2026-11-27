import { spawn } from 'node:child_process';
import { once } from 'node:events';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startTestDatabase, type TestDatabase } from '../support/database.js';

/** Starts src/main.ts as a real process and collects its JSON log lines. */
function startServer(env: Record<string, string>) {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    env: { ...process.env, LOG_LEVEL: 'info', LOG_PRETTY: 'false', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
  const waitFor = async (text: string, timeoutMs = 20_000) => {
    const started = Date.now();
    while (!output.includes(text)) {
      if (Date.now() - started > timeoutMs) {
        throw new Error(`timed out waiting for "${text}"; output so far:\n${output}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  return { child, waitFor, output: () => output };
}

describe('process lifecycle (integration)', () => {
  let database: TestDatabase;

  beforeAll(async () => {
    database = await startTestDatabase();
  });

  afterAll(async () => {
    await database.stop();
  });

  it('NFR-32 drains and exits cleanly on SIGTERM', { timeout: 60_000 }, async () => {
    const port = String(40_000 + Math.floor(Math.random() * 10_000));
    const server = startServer({ DATABASE_URL: database.container.getConnectionUri(), PORT: port });
    await server.waitFor('Server listening');

    const health = await fetch(`http://127.0.0.1:${port}/api/health/ready`);
    expect(health.status).toBe(200);

    server.child.kill('SIGTERM');
    const [code] = (await once(server.child, 'exit')) as [number | null];

    expect(code).toBe(0);
    expect(server.output()).toContain('shutting down');
  });

  it('NFR-15 exits with code 1 and names the problem when configuration is invalid', async () => {
    const server = startServer({ DATABASE_URL: 'not-a-url' });
    const [code] = (await once(server.child, 'exit')) as [number | null];

    expect(code).toBe(1);
    expect(server.output()).toContain('DATABASE_URL');
  });
});
