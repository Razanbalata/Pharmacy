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
            async () => (await import('@/pages/catalog/products')).ProductsPage,
          ),
          guarded(
            paths.productDetail,
            'products',
            async () => (await import('@/pages/catalog/product-detail')).ProductDetailPage,
          ),
          guarded(
            paths.productNew,
            'catalog',
            async () => (await import('@/pages/catalog/product-form')).ProductFormPage,
          ),
          guarded(
            paths.productEdit,
            'catalog',
            async () => (await import('@/pages/catalog/product-form')).ProductFormPage,
          ),
          guarded(
            paths.productImport,
            'catalog',
            async () => (await import('@/pages/catalog/product-import')).ProductImportPage,
          ),
          guarded(
            paths.productLabels,
            'catalog',
            async () => (await import('@/pages/catalog/product-labels')).ProductLabelsPage,
          ),
          guarded(
            paths.categories,
            'categories',
            async () => (await import('@/pages/catalog/categories')).CategoriesPage,
          ),
          guarded(
            paths.ingredients,
            'ingredients',
            async () => (await import('@/pages/catalog/ingredients')).IngredientsPage,
          ),
          guarded(
            paths.stockCounts,
            'stock',
            async () => (await import('@/pages/stock/counts')).CountsPage,
          ),
          guarded(
            paths.movements,
            'movements',
            async () => (await import('@/pages/stock/movements')).MovementsPage,
          ),
          guarded(
            paths.stockDamage,
            'stock',
            async () => (await import('@/pages/stock/damage')).DamagePage,
          ),
          guarded(
            paths.purchases,
            'purchases',
            async () => (await import('@/pages/purchasing/purchases')).PurchasesPage,
          ),
          guarded(
            paths.purchaseNew,
            'purchases',
            async () => (await import('@/pages/purchasing/purchase-order')).PurchaseOrderPage,
          ),
          guarded(
            paths.purchaseDetail,
            'purchases',
            async () => (await import('@/pages/purchasing/purchase-order')).PurchaseOrderPage,
          ),
          guarded(
            paths.purchaseReceive,
            'purchases',
            async () => (await import('@/pages/purchasing/purchase-receive')).PurchaseReceivePage,
          ),
          guarded(
            paths.suppliers,
            'suppliers',
            async () => (await import('@/pages/purchasing/suppliers')).SuppliersPage,
          ),
          guarded(
            paths.supplierDetail,
            'suppliers',
            async () =>
              (await import('@/pages/purchasing/supplier-statement')).SupplierStatementPage,
          ),
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
          guarded(
            paths.shift,
            'sales',
            async () => (await import('@/pages/sales/shift')).ShiftPage,
          ),
          page(paths.setup, async () => ({ Component: (await import('@/pages/setup')).SetupPage })),
        ],
      },
      page(paths.login, async () => ({
        Component: (await import('@/pages/auth/login')).LoginPage,
      })),
      page(paths.join, async () => ({ Component: (await import('@/pages/auth/join')).JoinPage })),
      page(paths.activate, async () => ({
        Component: (await import('@/pages/auth/activate')).ActivatePage,
      })),
      page(paths.forgotPassword, async () => ({
        Component: (await import('@/pages/auth/forgot-password')).ForgotPasswordPage,
      })),
    ],
  },
]
