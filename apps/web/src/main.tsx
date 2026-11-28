// Must run before any schema parses (see the module).
import './infra/zod-config';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { AppProviders } from './app/AppProviders';
import { createQueryClient } from './app/query-client';
import { createRoutes } from './app/routes';
import { consoleErrorReporter, installGlobalErrorHandlers } from './infra/error-reporter';

const reporter = consoleErrorReporter;
installGlobalErrorHandlers(reporter);

const router = createBrowserRouter(createRoutes());
const queryClient = createQueryClient(reporter);

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root is missing from index.html');
}

createRoot(root, {
  // ERR-22/23: the one place where errors caught by boundaries (including the route
  // error page) and uncaught render errors are reported.
  onCaughtError: (error, info) => {
    reporter.report(error, { source: 'boundary', componentStack: info.componentStack });
  },
  onUncaughtError: (error, info) => {
    reporter.report(error, { source: 'boundary', componentStack: info.componentStack });
  },
}).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
