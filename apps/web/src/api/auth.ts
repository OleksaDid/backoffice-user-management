import type {
  AuthResponse,
  MeResponse,
  SignedIn,
  SignInBody,
  SignUpBody,
} from '@backoffice/contracts';

import { apiRequest } from './client';
import { isApiError } from './errors';

export const authApi = {
  signUp: (body: SignUpBody) => apiRequest<AuthResponse>('POST', '/auth/sign-up', body),
  signIn: (body: SignInBody) => apiRequest<AuthResponse>('POST', '/auth/sign-in', body),
  signOut: () => apiRequest<undefined>('POST', '/auth/sign-out'),
  /** UI-AUTH-01: the signed-in user and session, or null when nobody is signed in. */
  async me(): Promise<SignedIn | null> {
    try {
      const current = await apiRequest<MeResponse>('GET', '/auth/me');
      return current.user ? current : null;
    } catch (error) {
      // Older API versions answered 401 instead of nulls; treat it the same.
      if (isApiError(error, 'UNAUTHENTICATED')) {
        return null;
      }
      throw error;
    }
  },
};
