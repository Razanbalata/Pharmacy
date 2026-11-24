import type { RouteObject } from 'react-router'
import type { PathKey } from '@/shared/config'
import { paths } from '@/shared/config'
import { AppLayout } from './AppLayout'
import { AppSkeleton } from './AppSkeleton'
import { RootLayout } from './RootLayout'

/** A screen whose module is not built yet: the link works and says when it comes. */
function comingSoon(key: PathKey, module: number): RouteObject {
  return {
    path: paths[key],
    lazy: async () => {
      const { ComingSoonPage } = await import('@/pages/coming-soon')
      return { Component: () => <ComingSoonPage navKey={key} module={module} /> }
    },
  }
}

/**
 * Every URL in the app. Keep it in step with pages/README.md.
 * Each page loads only when it is opened, so the first load stays small;
 * while it loads, the page's skeleton shows (see skeletons.ts).
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    hydrateFallbackElement: <AppSkeleton />,
    children: [
      {
        element: <AppLayout />,
        children: [
          comingSoon('dashboard', 9),
          comingSoon('alerts', 9),
          comingSoon('pos', 6),
          comingSoon('invoices', 6),
          comingSoon('returns', 6),
          comingSoon('customers', 7),
          comingSoon('products', 3),
          comingSoon('categories', 3),
          comingSoon('ingredients', 3),
          comingSoon('stockCounts', 5),
          comingSoon('movements', 5),
          comingSoon('purchases', 4),
          comingSoon('suppliers', 4),
          comingSoon('shifts', 8),
          comingSoon('reports', 10),
          comingSoon('assistant', 10),
          comingSoon('staff', 2),
          comingSoon('settings', 2),
          {
            path: paths.uiKit,
            lazy: async () => ({ Component: (await import('@/pages/ui-kit')).UiKitPage }),
          },
          {
            path: '*',
            lazy: async () => ({ Component: (await import('@/pages/not-found')).NotFoundPage }),
          },
        ],
      },
      comingSoon('login', 1),
      comingSoon('join', 1),
    ],
  },
]
