import type {
  CreateUserBody,
  Paginated,
  UpdateUserProfileBody,
  User,
  UserStatus,
} from '@backoffice/contracts';

import { apiRequest } from './client';

export const usersApi = {
  list: (page: number, pageSize: number) =>
    apiRequest<Paginated<User>>('GET', `/users?page=${page}&pageSize=${pageSize}`),
  create: (body: CreateUserBody) => apiRequest<User>('POST', '/users', body),
  updateProfile: (id: string, body: UpdateUserProfileBody) =>
    apiRequest<User>('PATCH', `/users/${id}`, body),
  setStatus: (id: string, status: UserStatus) =>
    apiRequest<User>('PUT', `/users/${id}/status`, { status }),
  remove: (id: string) => apiRequest<undefined>('DELETE', `/users/${id}`),
};
