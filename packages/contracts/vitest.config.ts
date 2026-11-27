import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      // NFR-51: CI fails if coverage drops below these.
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
      reporter: ['text-summary', 'html', 'json-summary'],
    },
  },
});
