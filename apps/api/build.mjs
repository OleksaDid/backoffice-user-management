// Bundles the API into dist/ with esbuild. Workspace packages (shared contracts) are
// inlined; npm dependencies stay external and are installed in the production image.
import { readFileSync } from 'node:fs';

import { build } from 'esbuild';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const external = Object.keys(pkg.dependencies ?? {}).filter(
  (name) => !name.startsWith('@backoffice/'),
);

await build({
  entryPoints: ['src/main.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  external,
  logLevel: 'info',
});
