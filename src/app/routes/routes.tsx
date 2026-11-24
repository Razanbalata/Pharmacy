import type { RouteObject } from 'react-router'
import { RootLayout } from './RootLayout'

/**
 * Every URL in the app. Keep it in step with pages/README.md.
 * Each page loads only when it is opened, so the first load stays small.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/pages/home')).HomePage }),
      },
      {
        path: 'ui-kit',
        lazy: async () => ({ Component: (await import('@/pages/ui-kit')).UiKitPage }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('@/pages/not-found')).NotFoundPage }),
      },
    ],
  },
]
