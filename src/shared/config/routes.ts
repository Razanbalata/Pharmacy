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
  settings: '/settings',
  login: '/login',
  join: '/join',
  uiKit: '/ui-kit',
} as const

export type PathKey = keyof typeof paths
