import { Alert, Button, Stack } from '@mantine/core';
import { Navigate, Outlet } from 'react-router';

import { messageFor } from '../api/error-messages';
import { LoadingScreen } from '../components/LoadingScreen';
import type { SignInState } from '../pages/SignInPage';
import { useSession, useSessionEndReason } from './session';

/** The session could not be checked (API down or restarting): offer a retry in place. */
function SessionCheckFailed({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Stack gap="sm" maw={480} mx="auto" py="xl">
      <Alert color="red" variant="light" role="alert" title="We could not check your session">
        {messageFor(error)}
      </Alert>
      <Button onClick={retry} w="fit-content">
        Try again
      </Button>
    </Stack>
  );
}

/**
 * UI-AUTH-02, DASH-01: protected pages. Visitors without a session see sign-up; after
 * logging out or when the session ended elsewhere they land on sign-in (UI-AUTH-11/12).
 */
export function RequireAuth() {
  const session = useSession();
  const endReason = useSessionEndReason();
  if (session.isPending) {
    return <LoadingScreen label="Checking your session" />;
  }
  if (session.isError) {
    return <SessionCheckFailed error={session.error} retry={() => void session.refetch()} />;
  }
  if (session.data) {
    return <Outlet />;
  }
  if (endReason) {
    const state: SignInState = endReason === 'session-ended' ? { notice: 'session-ended' } : {};
    return <Navigate to="/sign-in" replace state={state} />;
  }
  return <Navigate to="/sign-up" replace />;
}

/** UI-AUTH-02: signed-in users skip sign-up and sign-in. */
export function PublicOnly() {
  const session = useSession();
  if (session.isPending) {
    return <LoadingScreen label="Checking your session" />;
  }
  if (session.isError) {
    return <SessionCheckFailed error={session.error} retry={() => void session.refetch()} />;
  }
  return session.data ? <Navigate to="/" replace /> : <Outlet />;
}
