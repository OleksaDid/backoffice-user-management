import { expect, test } from '@playwright/test';

// These checks target the production web server (nginx); the Vite dev server sets none
// of these headers, so they are skipped there.
test.describe('production web server @full @smoke', () => {
  test('NFR-12 NFR-42 security headers and caching', async ({ page, request }) => {
    const index = await request.get('/');
    test.skip(
      !index.headers()['content-security-policy'],
      'not served by the production web server',
    );

    expect(index.headers()['cache-control']).toBe('no-cache');
    expect(index.headers()['content-security-policy']).toContain("script-src 'self'");
    expect(index.headers()['x-content-type-options']).toBe('nosniff');

    await page.goto('/');
    const asset = await page.evaluate(
      () => performance.getEntriesByType('resource').find((e) => e.name.includes('/assets/'))?.name,
    );
    expect(asset).toBeTruthy();
    const assetResponse = await request.get(asset ?? '');
    expect(assetResponse.headers()['cache-control']).toContain('immutable');

    const api = await request.get('/api/health/live');
    expect(api.headers()['cache-control']).toBe('no-store');
  });
});
