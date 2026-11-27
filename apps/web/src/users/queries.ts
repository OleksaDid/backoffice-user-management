import {
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

/** DASH-62: every successful change refetches the list (and the greeting, which may change). */
function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: usersQueryKey }),
      queryClient.invalidateQueries({ queryKey: sessionQueryKey }),
    ]);
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: usersApi.create, onSuccess: invalidate });
}

export function useUpdateProfile() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserProfileBody }) =>
      usersApi.updateProfile(id, body),
    onSuccess: invalidate,
  });
}

export function useSetStatus() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      usersApi.setStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (id: string) => usersApi.remove(id), onSuccess: invalidate });
}
