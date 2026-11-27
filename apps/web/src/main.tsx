import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { createQueryClient } from './app/query-client';
import { createRoutes } from './app/routes';
import { theme } from './app/theme';
import { sessionQueryKey } from './auth/session';
import { consoleErrorReporter, installGlobalErrorHandlers } from './infra/error-reporter';
import type { SignInState } from './pages/SignInPage';

const reporter = consoleErrorReporter;
installGlobalErrorHandlers(reporter);

const router = createBrowserRouter(createRoutes(reporter));
const queryClient = createQueryClient({
  reporter,
  // UI-AUTH-12: the session ended elsewhere (expired, terminated, user deactivated).
  onUnauthorized: () => {
    queryClient.setQueryData(sessionQueryKey, null);
    const state: SignInState = { notice: 'session-ended' };
    void router.navigate('/sign-in', { replace: true, state });
  },
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root is missing from index.html');
}

createRoot(root, {
  // ERR-22/23: errors React catches in boundaries are reported too.
  onCaughtError: (error, info) => {
    reporter.report(error, { source: 'boundary', componentStack: info.componentStack });
  },
  onUncaughtError: (error, info) => {
    reporter.report(error, { source: 'boundary', componentStack: info.componentStack });
  },
}).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
