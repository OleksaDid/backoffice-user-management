import { Navigate, type RouteObject } from 'react-router';

import { PublicOnly, RequireAuth } from '../auth/guards';
import { SignInPage } from '../pages/SignInPage';
import { SignUpPage } from '../pages/SignUpPage';
import { AppLayout } from './AppLayout';
import { RouteError } from './RouteError';

/** UI-AUTH-01 to UI-AUTH-03: the app's routes; shared by the browser and by tests. */
export function createRoutes(): RouteObject[] {
  return [
    {
      element: <AppLayout />,
      errorElement: <RouteError />,
      children: [
        {
          element: <PublicOnly />,
          children: [
            { path: 'sign-up', element: <SignUpPage /> },
            { path: 'sign-in', element: <SignInPage /> },
          ],
        },
        {
          element: <RequireAuth />,
          // DASH-01: the dashboard replaces the welcome page; loaded on demand (NFR-42).
          children: [
            {
              index: true,
              lazy: async () => ({
                Component: (await import('../pages/dashboard/DashboardPage')).DashboardPage,
              }),
            },
          ],
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ];
}
