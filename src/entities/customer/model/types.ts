/** Enough of a customer to pick one at the till and sell on credit. */
export interface CustomerOption {
  id: number
  name: string
  phone: string
  /** What the customer owes now. */
  debt: number
  /** The most they may owe; selling beyond it needs the manager. */
  debtLimit: number
  /** Off: the customer pays on the spot, never on credit. */
  creditAllowed: boolean
}

/** How long the oldest unpaid credit sale has waited. */
export type DebtAge = 'none' | 'recent' | 'weeks' | 'late'

export interface Customer extends CustomerOption {
  notes: string
  /** When the customer was added. */
  since: string
  lastPurchase: string | null
  /** The oldest credit sale not yet paid off, payments counted oldest first. */
  oldestDebt: string | null
  /** Days since `oldestDebt`. */
  debtDays: number
  debtAge: DebtAge
}

export const CUSTOMER_FILTERS = ['all', 'withDebt', 'overLimit', 'late'] as const
export type CustomerFilter = (typeof CUSTOMER_FILTERS)[number]

export interface CustomersSummary {
  totalDebt: number
  withDebt: number
  late: { count: number; amount: number }
  collectedThisMonth: number
  counts: Record<CustomerFilter, number>
}

export interface CustomerInput {
  name: string
  phone: string
  creditAllowed: boolean
  debtLimit: number
  /** Debt carried over from the paper notebook. Only when adding. */
  openingDebt: number
  notes: string
}

export const CUSTOMER_PAYMENT_METHODS = ['cash', 'bank'] as const
export type CustomerPaymentMethod = (typeof CUSTOMER_PAYMENT_METHODS)[number]

export interface CustomerPaymentInput {
  amount: number
  method: CustomerPaymentMethod
}

export interface CustomerPaymentResult {
  receipt: string
  amount: number
  balance: number
  at: string
}

export const CUSTOMER_STATEMENT_PERIODS = ['month', 'quarter', 'year'] as const
export type CustomerStatementPeriod = (typeof CUSTOMER_STATEMENT_PERIODS)[number]

/** A credit sale raises the debt; a payment or a refund off the debt lowers it. */
export interface CustomerStatementLine {
  id: number
  at: string
  kind: 'opening' | 'sale' | 'payment' | 'return'
  /** Invoice, receipt or return number. */
  reference: string
  /** To open the invoice; null when it is not on the system. */
  invoiceId: number | null
  method: CustomerPaymentMethod | null
  /** Who did it, and for a sale how many items. */
  actor: string
  items: number | null
  debit: number
  credit: number
  balance: number
}

export interface CustomerStatement {
  customer: Customer
  period: CustomerStatementPeriod
  from: string
  openingBalance: number
  lines: CustomerStatementLine[]
  /** Everything bought in the current month, cash or credit. */
  purchasesThisMonth: number
  /** What the customer bought lately, newest first, to remind them before it runs out. */
  recent: { productId: number; name: string; lastBought: string }[]
}
