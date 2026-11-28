import {
  type MeResponse,
  DEFAULT_PAGE_SIZE,
  type UpdateUserProfileBody,
  type UserStatus,
} from '@backoffice/contracts';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usersApi } from '../api/users';
import { sessionQueryKey } from '../auth/session';

export const usersQueryKey = ['users'] as const;

/** DASH-11, DASH-15: one page of 6 users; the previous page stays visible while loading. */
export function useUsersPage(page: number) {
  return useQuery({
    queryKey: [...usersQueryKey, { page, pageSize: DEFAULT_PAGE_SIZE }],
    queryFn: () => usersApi.list(page, DEFAULT_PAGE_SIZE),
    placeholderData: keepPreviousData,
  });
}

/**
 * DASH-62: after every change, successful or not, the list is refetched: a 404 or 409
 * usually means someone else changed the data, and the table must show that.
 */
function useRefreshUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: usersQueryKey });
}

export function useCreateUser() {
  const refresh = useRefreshUsers();
  return useMutation({ mutationFn: usersApi.create, onSettled: refresh });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserProfileBody }) =>
      usersApi.updateProfile(id, body),
    onSettled: async (_data, _error, { id }) => {
      await refresh();
      // Only your own name appears in the greeting.
      if (queryClient.getQueryData<MeResponse | null>(sessionQueryKey)?.user.id === id) {
        await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      }
    },
  });
}

export function useSetStatus() {
  const refresh = useRefreshUsers();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      usersApi.setStatus(id, status),
    onSettled: refresh,
  });
}

export function useDeleteUser() {
  const refresh = useRefreshUsers();
  return useMutation({ mutationFn: (id: string) => usersApi.remove(id), onSettled: refresh });
}
