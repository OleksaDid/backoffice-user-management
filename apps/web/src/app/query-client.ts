import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError, isApiError, NetworkError } from '../api/errors';
import type { ErrorReporter } from '../infra/error-reporter';

export interface QueryClientOptions {
  /** UI-AUTH-12: called when the API says the session is gone. */
  onUnauthorized: () => void;
  reporter: ErrorReporter;
}

function isExpected(error: unknown): boolean {
  return (error instanceof ApiError && error.status < 500) || error instanceof NetworkError;
}

/**
 * Server state cache. A 401 from any request (except the session probe itself) means
 * the session ended elsewhere, so the app returns to sign-in; unexpected errors are
 * reported. Only network failures are retried.
 */
export function createQueryClient({ onUnauthorized, reporter }: QueryClientOptions): QueryClient {
  const onError = (error: unknown) => {
    if (isApiError(error, 'UNAUTHENTICATED')) {
      onUnauthorized();
    } else if (!isExpected(error)) {
      reporter.report(error, { source: 'query' });
    }
  };
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        retry: (failures, error) => error instanceof NetworkError && failures < 2,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}
