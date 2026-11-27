import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin API in development too, so cookies behave as in production.
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: {
    sourcemap: true,
  },
});
