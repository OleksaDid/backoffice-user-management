import type { ErrorCode } from '@backoffice/contracts';

import { ApiError, NetworkError } from './errors';

/** ERR-21: user-facing wording for every error code, in one place. */
const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Some of the information is invalid. Check the highlighted fields.',
  UNAUTHENTICATED: 'Your session has ended. Please sign in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_INACTIVE: 'This account is inactive. Ask an administrator to activate it.',
  CSRF_REJECTED: 'The request was blocked for security reasons. Reload the page and try again.',
  USER_NOT_FOUND: 'This user no longer exists.',
  SESSION_NOT_FOUND: 'This session no longer exists.',
  ROUTE_NOT_FOUND: 'Something went wrong. Please try again.',
  EMAIL_ALREADY_REGISTERED: 'An account with this email already exists.',
  USER_NAME_LOCKED: 'Activate the user before changing their name.',
  SELF_MODIFICATION_FORBIDDEN: 'You cannot deactivate or delete your own account.',
  PAYLOAD_TOO_LARGE: 'The submitted data is too large.',
  UNSUPPORTED_MEDIA_TYPE: 'Something went wrong. Please try again.',
  RATE_LIMITED: 'Too many attempts. Wait a minute and try again.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again shortly.',
};

export function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code];
  }
  if (error instanceof NetworkError) {
    return 'The server could not be reached. Check your connection and try again.';
  }
  return MESSAGES.INTERNAL_ERROR;
}
