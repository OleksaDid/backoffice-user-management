import type { AuthResponse } from '@backoffice/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { authApi } from '../api/auth';

export const sessionQueryKey = ['auth', 'me'] as const;

/** UI-AUTH-01: who is signed in; `data` is null when there is no active session. */
export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => authApi.me(),
    staleTime: 5 * 60 * 1000,
  });
}

/** After sign-in or sign-up: remember the session without another round trip. */
export function useStoreSession() {
  const queryClient = useQueryClient();
  return (auth: AuthResponse) => {
    queryClient.setQueryData(sessionQueryKey, auth);
  };
}

/** UI-AUTH-11: ends the session and goes to sign-in, also when the request fails. */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.signOut,
    onSettled: async () => {
      // Navigate first, rendered synchronously: clearing the session while the protected
      // page is still on screen would make its guard redirect to sign-up instead. The
      // flag lets the sign-in page render until the session is cleared.
      await navigate('/sign-in', { replace: true, state: { signedOut: true }, flushSync: true });
      queryClient.setQueryData(sessionQueryKey, null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    },
  });
}
