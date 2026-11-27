import { Alert, Button, Stack } from '@mantine/core';
import { useRouteError } from 'react-router';

import { messageFor } from '../api/error-messages';
import { PageHeading } from '../components/PageHeading';

/**
 * ERR-22: route error boundary. Shows an accessible fallback with a way to recover
 * instead of a blank page. Reporting happens once, in the React root's onCaughtError.
 */
export function RouteError() {
  const error = useRouteError();

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
