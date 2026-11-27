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
      // Only if the layout itself fails: the fallback then needs its own main landmark.
      errorElement: (
        <main>
          <RouteError />
        </main>
      ),
      children: [
        {
          // Page errors render inside the layout, keeping the header, theme switcher
          // and skip link (THEME-01, DASH-02).
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
      ],
    },
  ];
}
