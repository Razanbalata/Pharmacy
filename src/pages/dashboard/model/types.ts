/** One product line in a short list on the dashboard. */
export interface DashboardProduct {
  productId: number
  name: string
}

export type DashboardNote =
  | ({ kind: 'expiring'; expiry: string; quantity: number } & DashboardProduct)
  | ({
      kind: 'shortage'
      quantity: number
      minStock: number
      draft: { id: number; number: string } | null
    } & DashboardProduct)
  | ({ kind: 'topSeller'; quantity: number; unit: string } & DashboardProduct)

export type ActivityKind =
  'sale' | 'shiftOpened' | 'damage' | 'countStarted' | 'customerPayment' | 'expense' | 'return'

/** Something that happened today. The app words it from the kind. */
export interface DashboardEvent {
  at: string
  kind: ActivityKind
  actor: string
  params: Record<string, string | number>
}

/**
 * Everything the home screens show, in one request. The server leaves out what the role
 * may not see: profit and the drawer are null except for the manager.
 */
export interface Dashboard {
  attention: {
    expired: { batches: number }
    expiring: { count: number; nearest: ({ expiry: string } & DashboardProduct) | null }
    low: {
      count: number
      urgent: ({ quantity: number; minStock: number } & DashboardProduct) | null
    }
    lateDebts: { count: number; amount: number }
  }
  sales: {
    today: number
    invoices: number
    yesterday: number
    profit: number | null
    /** Profit as a share of sales, in percent. */
    margin: number | null
  }
  drawer: { shiftNumber: number; expected: number } | null
  /** Products with an expired batch still in stock. */
  expiredProducts: number
  notes: DashboardNote[]
  activity: DashboardEvent[]
  tasks: {
    expired: { batches: number; names: string } | null
    count: {
      id: number
      scope: string | null
      counted: number
      total: number
      differences: number
    } | null
    receive: { orderId: number; number: string; supplier: string; items: number } | null
  }
  expiring: { total: number; items: ({ expiry: string; quantity: number } & DashboardProduct)[] }
  low: {
    total: number
    items: ({ quantity: number; minStock: number } & DashboardProduct)[]
    /** The draft order that already has the products shown. */
    draft: { id: number; number: string } | null
  }
  /** The signed-in user's own sales today. */
  mine: { total: number; invoices: number }
  shift: { number: number; cashier: string } | null
}

export const TREND_DAYS = ['7', '30', '90'] as const
export type TrendDays = (typeof TREND_DAYS)[number]

export interface TrendPoint {
  date: string
  total: number
}
