import { Center, Loader, VisuallyHidden } from '@mantine/core';

/**
 * The label is real text in a status region: aria-label on Mantine's Loader (a span
 * without a role) is not allowed by ARIA and was flagged by axe on slow networks.
 */
export function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <Center py="xl" role="status">
      <Loader aria-hidden />
      <VisuallyHidden>{label}</VisuallyHidden>
    </Center>
  );
}
