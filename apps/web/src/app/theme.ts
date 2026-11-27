import { Anchor, type CSSVariablesResolver, createTheme, Modal } from '@mantine/core';

/**
 * Design tokens. Mantine exposes them as CSS variables, so components and our own CSS
 * share one source; the light and dark palettes are tuned for WCAG AA contrast.
 */
export const theme = createTheme({
  primaryColor: 'brand',
  // Filled buttons keep white text at AA contrast in both schemes (found by axe).
  primaryShade: { light: 7, dark: 6 },
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
  // Buttons, switches and pagination controls show the pointer cursor.
  cursorType: 'pointer',
  respectReducedMotion: true,
  components: {
    // WCAG 1.4.1: links inside text must not rely on colour alone (axe link-in-text-block).
    Anchor: Anchor.extend({ defaultProps: { underline: 'always' } }),
    // WCAG 4.1.2: the dialog close button has no accessible name by default (axe button-name).
    Modal: Modal.extend({ defaultProps: { closeButtonProps: { 'aria-label': 'Close dialog' } } }),
  },
});

/**
 * Mantine's default "dimmed" grey (#868e96) is 3.3:1 on white, below the 4.5:1 AA
 * minimum for normal text (found by the axe check). Use darker/lighter greys instead.
 */
export const cssVariablesResolver: CSSVariablesResolver = (current) => ({
  variables: {},
  light: { '--mantine-color-dimmed': current.colors.gray[7] },
  dark: {
    '--mantine-color-dimmed': current.colors.gray[4],
    // Links on the dark background need a light brand tint for 4.5:1.
    '--mantine-color-anchor': current.colors.brand?.[2] ?? current.colors.blue[3],
  },
});
