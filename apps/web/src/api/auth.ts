import type { AuthResponse, MeResponse, SignInBody, SignUpBody } from '@backoffice/contracts';

import { apiRequest } from './client';
import { isApiError } from './errors';

export const authApi = {
  signUp: (body: SignUpBody) => apiRequest<AuthResponse>('POST', '/auth/sign-up', body),
  signIn: (body: SignInBody) => apiRequest<AuthResponse>('POST', '/auth/sign-in', body),
  signOut: () => apiRequest<undefined>('POST', '/auth/sign-out'),
  /** UI-AUTH-01: the current session, or null when there is none (401 is not an error here). */
  async me(): Promise<MeResponse | null> {
    try {
      return await apiRequest<MeResponse>('GET', '/auth/me');
    } catch (error) {
      if (isApiError(error, 'UNAUTHENTICATED')) {
        return null;
      }
      throw error;
    }
  },
};
