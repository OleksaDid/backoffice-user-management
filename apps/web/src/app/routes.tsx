import { Navigate, type RouteObject } from 'react-router';

import { PublicOnly, RequireAuth } from '../auth/guards';
import type { ErrorReporter } from '../infra/error-reporter';
import { SignInPage } from '../pages/SignInPage';
import { SignUpPage } from '../pages/SignUpPage';
import { WelcomePage } from '../pages/WelcomePage';
import { AppLayout } from './AppLayout';
import { RouteError } from './RouteError';

/** UI-AUTH-01 to UI-AUTH-03: the app's routes; shared by the browser and by tests. */
export function createRoutes(reporter: ErrorReporter): RouteObject[] {
  return [
    {
      element: <AppLayout />,
      errorElement: <RouteError reporter={reporter} />,
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
          children: [{ index: true, element: <WelcomePage /> }],
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ];
}
