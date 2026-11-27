import type { AuthResponse } from '@backoffice/contracts';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '../api/auth';

export const sessionQueryKey = ['auth', 'me'] as const;
const endReasonQueryKey = ['auth', 'end-reason'] as const;

/** Why the last session ended in this tab; decides where and how the guard redirects. */
export type SessionEndReason = 'signed-out' | 'session-ended';

/** UI-AUTH-01: who is signed in; `data` is null when there is no active session. */
export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => authApi.me(),
    staleTime: 5 * 60 * 1000,
  });
}

/** The reason recorded by endSession, or null if no session ended in this tab. */
export function useSessionEndReason(): SessionEndReason | null {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<SessionEndReason>(endReasonQueryKey) ?? null;
}

/**
 * The single place where a session ends in the app (log out, or a 401 from the API).
 * Clearing the session makes the route guard redirect to sign-in, so callers never
 * navigate themselves and cannot race the guard.
 */
export function endSession(queryClient: QueryClient, reason: SessionEndReason): void {
  queryClient.setQueryData(endReasonQueryKey, reason);
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
  queryClient.setQueryData(sessionQueryKey, null);
}

/** After sign-in or sign-up: remember the session without another round trip. */
export function useStoreSession() {
  const queryClient = useQueryClient();
  return (auth: AuthResponse) => {
    queryClient.removeQueries({ queryKey: endReasonQueryKey });
    queryClient.setQueryData(sessionQueryKey, auth);
  };
}

/** UI-AUTH-11: ends the session and returns to sign-in, also when the request fails. */
export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.signOut,
    onSettled: () => {
      endSession(queryClient, 'signed-out');
    },
  });
}
