/**
 * Every address in the app, in one place. Links and routes both read from here,
 * so renaming an address is a one-line change.
 */
export const paths = {
  dashboard: '/',
  alerts: '/alerts',
  pos: '/sales/pos',
  invoices: '/sales/invoices',
  returns: '/sales/returns',
  customers: '/customers',
  products: '/products',
  productNew: '/products/new',
  productImport: '/products/import',
  productLabels: '/products/labels',
  productDetail: '/products/:id',
  productEdit: '/products/:id/edit',
  categories: '/categories',
  ingredients: '/ingredients',
  stockCounts: '/stock/counts',
  movements: '/stock/movements',
  purchases: '/purchases',
  suppliers: '/suppliers',
  shifts: '/finance/shifts',
  reports: '/reports',
  assistant: '/assistant',
  staff: '/staff',
  activity: '/staff/activity',
  settings: '/settings',
  login: '/login',
  join: '/join',
  activate: '/activate/:token',
  forgotPassword: '/forgot-password',
  setup: '/setup',
  gettingStarted: '/getting-started',
  platformRequests: '/platform/requests',
  platformPharmacies: '/platform/pharmacies',
  platformBilling: '/platform/billing',
  uiKit: '/ui-kit',
} as const

export type PathKey = keyof typeof paths

/** Fills :params in an address, e.g. to(paths.activate, { token: 'abc' }) → /activate/abc */
export function to(path: string, params: Record<string, string | number>): string {
  return path.replace(/:(\w+)/g, (_, key: string) => encodeURIComponent(String(params[key] ?? '')))
}
