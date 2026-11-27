import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    environment: 'node',
    // Integration tests start PostgreSQL containers; under coverage instrumentation and
    // parallel suites (pre-push, CI) the 5 s default is too tight for database work.
    hookTimeout: 120_000,
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      // NFR-51: CI fails if coverage drops below these (current values are a few points higher).
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
      reporter: ['text-summary', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/main.ts'],
    },
  },
});
