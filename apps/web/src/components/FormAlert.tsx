import { Alert } from '@mantine/core';

/** Form-level error, announced immediately by screen readers (role="alert"). */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <Alert color="red" variant="light" role="alert" title="Something went wrong">
      {message}
    </Alert>
  );
}
