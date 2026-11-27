import { Navigate, Outlet, useLocation } from 'react-router';

import { LoadingScreen } from '../components/LoadingScreen';
import { useSession } from './session';

/** UI-AUTH-02, DASH-01: protected pages; without a session the sign-up page is shown. */
export function RequireAuth() {
  const session = useSession();
  if (session.isPending) {
    return <LoadingScreen label="Checking your session" />;
  }
  if (session.isError) {
    throw session.error;
  }
  return session.data ? <Outlet /> : <Navigate to="/sign-up" replace />;
}

/** UI-AUTH-02: signed-in users skip sign-up and sign-in (except while signing out). */
export function PublicOnly() {
  const session = useSession();
  const signingOut = (useLocation().state as { signedOut?: boolean } | null)?.signedOut === true;
  if (session.isPending) {
    return <LoadingScreen label="Checking your session" />;
  }
  if (session.isError) {
    throw session.error;
  }
  return session.data && !signingOut ? <Navigate to="/" replace /> : <Outlet />;
}
