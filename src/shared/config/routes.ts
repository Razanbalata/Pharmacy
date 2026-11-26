/**
 * Every address in the app, in one place. Links and routes both read from here,
 * so renaming an address is a one-line change.
 */
export const paths = {
  dashboard: '/',
  alerts: '/alerts',
  pos: '/sales/pos',
  shift: '/sales/shift',
  invoices: '/sales/invoices',
  invoiceDetail: '/sales/invoices/:id',
  returns: '/sales/returns',
  customers: '/customers',
  customerDetail: '/customers/:id',
  products: '/products',
  productNew: '/products/new',
  productImport: '/products/import',
  productLabels: '/products/labels',
  productDetail: '/products/:id',
  productEdit: '/products/:id/edit',
  categories: '/categories',
  ingredients: '/ingredients',
  stockCounts: '/stock/counts',
  stockDamage: '/stock/damage',
  movements: '/stock/movements',
  purchases: '/purchases',
  purchaseNew: '/purchases/new',
  purchaseDetail: '/purchases/:id',
  purchaseReceive: '/purchases/:id/receive',
  suppliers: '/suppliers',
  supplierDetail: '/suppliers/:id',
  shifts: '/finance/shifts',
  expenses: '/finance/expenses',
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
  platformPharmacyDetail: '/platform/pharmacies/:id',
  platformBilling: '/platform/billing',
  uiKit: '/ui-kit',
} as const

export type PathKey = keyof typeof paths

/** Fills :params in an address, e.g. to(paths.activate, { token: 'abc' }) → /activate/abc */
export function to(path: string, params: Record<string, string | number>): string {
  return path.replace(/:(\w+)/g, (_, key: string) => encodeURIComponent(String(params[key] ?? '')))
}
