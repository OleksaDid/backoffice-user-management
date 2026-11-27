import { Alert, Button, Stack } from '@mantine/core';
import { useEffect } from 'react';
import { useRouteError } from 'react-router';

import { messageFor } from '../api/error-messages';
import { PageHeading } from '../components/PageHeading';
import type { ErrorReporter } from '../infra/error-reporter';

/**
 * ERR-22: per-route error boundary. Shows an accessible fallback with a way to recover
 * instead of a blank page, and reports the error.
 */
export function RouteError({ reporter }: { reporter: ErrorReporter }) {
  const error = useRouteError();
  useEffect(() => {
    reporter.report(error, { source: 'boundary' });
  }, [error, reporter]);

  return (
    <Stack gap="md" p="xl" maw={560} mx="auto" component="main">
      <PageHeading>Something went wrong</PageHeading>
      <Alert color="red" variant="light">
        {messageFor(error)}
      </Alert>
      <Button
        onClick={() => {
          window.location.assign('/');
        }}
        w="fit-content"
      >
        Reload the app
      </Button>
    </Stack>
  );
}
