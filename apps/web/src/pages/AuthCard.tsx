import { Paper, Stack } from '@mantine/core';
import type { ReactNode } from 'react';

/** Shared frame of the sign-up and sign-in pages. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Paper withBorder radius="md" p="xl" maw={440} mx="auto">
      <Stack gap="md">{children}</Stack>
    </Paper>
  );
}
