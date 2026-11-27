import { createTheme } from '@mantine/core';

/**
 * Design tokens. Mantine exposes them as CSS variables, so components and our own CSS
 * share one source; the light and dark palettes are tuned for WCAG AA contrast.
 */
export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 7, dark: 4 },
  colors: {
    brand: [
      '#e8f1fb',
      '#cfdff2',
      '#a2bfe4',
      '#729dd6',
      '#4a80ca',
      '#316ec3',
      '#2363b9',
      '#1c4f8c',
      '#14407a',
      '#07345f',
    ],
  },
  fontFamily:
    'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  defaultRadius: 'md',
  focusRing: 'auto',
  respectReducedMotion: true,
});
