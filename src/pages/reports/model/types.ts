export const REPORT_TABS = ['sales', 'profit', 'stock', 'debts'] as const
export type ReportTab = (typeof REPORT_TABS)[number]

export const REPORT_PERIODS = ['today', 'week', 'month', 'lastMonth', 'year'] as const
export type ReportPeriod = (typeof REPORT_PERIODS)[number]

/** The dates a report covers, and the same length before it to compare with. */
export interface ReportRange {
  period: ReportPeriod
  from: string
  to: string
  compareFrom: string
  compareTo: string
}

export interface SalesReport extends ReportRange {
  sales: number
  invoices: number
  average: number
  returns: number
  previous: { sales: number; invoices: number; average: number }
  /** A bar per day, or per month for the year. */
  series: { unit: 'day' | 'month'; points: { date: string; total: number }[] }
  byMethod: { cash: number; bank: number; credit: number }
  byStaff: { id: number; name: string; total: number; invoices: number }[]
  /** Only invoices kept line by line know their products. */
  top: { productId: number; name: string; quantity: number; unit: string; total: number }[]
}

export interface ProfitReport extends ReportRange {
  sales: number
  cost: number
  gross: number
  expenses: number
  damage: number
  net: number
  /** In percent of sales. */
  grossMargin: number
  netMargin: number
  previousNetMargin: number | null
  /** `archived`: older shifts kept as totals, with no products to sort by category. */
  byCategory: {
    id: number | null
    name: string
    sales: number
    profit: number
    archived?: boolean
  }[]
  /** Products whose price leaves less than 22% over their last cost. */
  lowMargin: { productId: number; name: string; margin: number }[]
}

export interface StockReport {
  valueAtCost: number
  valueAtPrice: number
  damageThisMonth: number
  /** In stock and not sold for 60 days. */
  stagnant: { count: number; value: number }
  expired: { batches: number; value: number }
  within30: { count: number; value: number }
  within90: { count: number; value: number }
  nearest: {
    productId: number
    name: string
    batch: string
    expiry: string
    quantity: number
    unit: string
    value: number
  }[]
  byCategory: { name: string; value: number }[]
}

export interface DebtsReport {
  customers: { total: number; recent: number; weeks: number; late: number }
  top: { customerId: number; name: string; debt: number; days: number; late: boolean }[]
  /** Late customers with a phone, for the WhatsApp reminders. */
  reminders: { customerId: number; name: string; phone: string; debt: number }[]
  collectedThisMonth: number
  suppliers: { total: number; list: { supplierId: number; name: string; balance: number }[] }
}
