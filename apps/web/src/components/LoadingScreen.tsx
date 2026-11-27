import { Center, Loader } from '@mantine/core';

export function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <Center py="xl" role="status" aria-live="polite">
      <Loader aria-label={label} />
    </Center>
  );
}
