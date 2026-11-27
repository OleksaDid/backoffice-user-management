import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError, isApiError, NetworkError } from '../api/errors';
import { endSession } from '../auth/session';
import type { ErrorReporter } from '../infra/error-reporter';

function isExpected(error: unknown): boolean {
  return (error instanceof ApiError && error.status < 500) || error instanceof NetworkError;
}

/** Network failures and 5xx (e.g. a restarting API) are worth retrying; 4xx are not. */
function isTransient(error: unknown): boolean {
  return error instanceof NetworkError || (error instanceof ApiError && error.status >= 500);
}

/**
 * Server state cache shared by the browser app and tests:
 * - UI-AUTH-12: a 401 from any request (the session probe answers null instead) means the
 *   session ended elsewhere, so the session is ended in the app and the guard shows sign-in
 * - ERR-23: unexpected errors are reported; expected 4xx and network failures are not
 * - transient failures of queries are retried twice
 */
export function createQueryClient(reporter: ErrorReporter): QueryClient {
  const onError = (error: unknown) => {
    if (isApiError(error, 'UNAUTHENTICATED')) {
      endSession(client, 'session-ended');
    } else if (!isExpected(error)) {
      reporter.report(error, { source: 'query' });
    }
  };
  const client = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        retry: (failures, error) => isTransient(error) && failures < 2,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
  return client;
}
