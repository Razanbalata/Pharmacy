import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'
import type { PathKey } from '@/shared/config'
import { paths } from '@/shared/config'
import type { Area } from '@/entities/session'
import { AppLayout } from './AppLayout'
import { AreaGuard } from './AreaGuard'
import { AppSkeleton } from './AppSkeleton'
import { PlatformLayout } from './PlatformLayout'
import { RequireAuth } from './RequireAuth'
import { RootLayout } from './RootLayout'

function page(path: string, load: () => Promise<{ Component: ComponentType }>): RouteObject {
  return { path, lazy: load }
}

/** A page only some roles may open. */
function guarded(path: string, area: Area, load: () => Promise<ComponentType>): RouteObject {
  return {
    path,
    lazy: async () => {
      const Page = await load()
      return {
        Component: () => (
          <AreaGuard area={area}>
            <Page />
          </AreaGuard>
        ),
      }
    },
  }
}

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
          {
            index: true,
            lazy: async () => ({ Component: (await import('./DashboardEntry')).DashboardEntry }),
          },
          page(paths.gettingStarted, async () => ({
            Component: (await import('@/pages/getting-started')).GettingStartedPage,
          })),
          comingSoon('alerts', 9),
          comingSoon('pos', 6),
          comingSoon('invoices', 6),
          comingSoon('returns', 6),
          comingSoon('customers', 7),
          guarded(
            paths.products,
            'products',
            async () => (await import('@/pages/products')).ProductsPage,
          ),
          guarded(
            paths.productDetail,
            'products',
            async () => (await import('@/pages/product-detail')).ProductDetailPage,
          ),
          guarded(
            paths.productNew,
            'catalog',
            async () => (await import('@/pages/product-form')).ProductFormPage,
          ),
          guarded(
            paths.productEdit,
            'catalog',
            async () => (await import('@/pages/product-form')).ProductFormPage,
          ),
          comingSoon('productImport', 3),
          guarded(
            paths.productLabels,
            'catalog',
            async () => (await import('@/pages/product-labels')).ProductLabelsPage,
          ),
          guarded(
            paths.categories,
            'categories',
            async () => (await import('@/pages/categories')).CategoriesPage,
          ),
          guarded(
            paths.ingredients,
            'ingredients',
            async () => (await import('@/pages/ingredients')).IngredientsPage,
          ),
          comingSoon('stockCounts', 5),
          comingSoon('movements', 5),
          comingSoon('purchases', 4),
          comingSoon('suppliers', 4),
          comingSoon('shifts', 8),
          comingSoon('reports', 10),
          comingSoon('assistant', 10),
          guarded(paths.staff, 'staff', async () => (await import('@/pages/staff')).StaffPage),
          guarded(
            paths.activity,
            'staff',
            async () => (await import('@/pages/activity')).ActivityPage,
          ),
          guarded(
            paths.settings,
            'settings',
            async () => (await import('@/pages/settings')).SettingsPage,
          ),
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
      {
        element: <PlatformLayout />,
        children: [
          page(paths.platformRequests, async () => ({
            Component: (await import('@/pages/platform-requests')).PlatformRequestsPage,
          })),
          comingSoon('platformPharmacies', 11),
          comingSoon('platformBilling', 11),
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          page(paths.setup, async () => ({ Component: (await import('@/pages/setup')).SetupPage })),
        ],
      },
      page(paths.login, async () => ({ Component: (await import('@/pages/login')).LoginPage })),
      page(paths.join, async () => ({ Component: (await import('@/pages/join')).JoinPage })),
      page(paths.activate, async () => ({
        Component: (await import('@/pages/activate')).ActivatePage,
      })),
      page(paths.forgotPassword, async () => ({
        Component: (await import('@/pages/forgot-password')).ForgotPasswordPage,
      })),
    ],
  },
]
