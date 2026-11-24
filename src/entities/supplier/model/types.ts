/** Just enough of a supplier to pick one in a list. */
export interface SupplierOption {
  id: number
  name: string
}

export interface Supplier extends SupplierOption {
  /** Who to talk to there, e.g. "خالد · مبيعات". */
  contactName: string
  phone: string
  address: string
  notes: string
  /** What the pharmacy owes this supplier now. Zero or more. */
  balance: number
  lastOrder: { id: number; number: string; date: string } | null
  ordersThisYear: number
}

export interface SupplierInput {
  name: string
  contactName: string
  phone: string
  address: string
  notes: string
}

export interface SuppliersSummary {
  totalOwed: number
  purchasesThisMonth: number
  awaitingDelivery: number
}

export const STATEMENT_PERIODS = ['month', 'quarter', 'year'] as const
export type StatementPeriod = (typeof STATEMENT_PERIODS)[number]

export const PAYMENT_METHODS = ['cash', 'bank', 'cheque'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** One line of the account: a purchase invoice raises what is owed, a payment lowers it. */
export interface StatementLine {
  id: number
  date: string
  kind: 'invoice' | 'payment'
  /** PO number for an invoice; method for a payment. */
  reference: string
  /** For an invoice: the purchase order id, to open it. */
  orderId: number | null
  /** The supplier's own invoice number, the payment note, who paid. */
  detail: string
  method: PaymentMethod | null
  debit: number
  credit: number
  /** What was owed after this line. */
  balance: number
}

export interface SupplierStatement {
  supplier: Supplier
  period: StatementPeriod
  from: string
  /** What was owed when the period started. */
  openingBalance: number
  lines: StatementLine[]
  purchases: number
  paid: number
  /** A draft order for this supplier, to finish and send. */
  draft: { id: number; number: string } | null
}

export interface SupplierPaymentInput {
  amount: number
  method: PaymentMethod
  /** Cash from the open shift's drawer; it lowers the cash expected at closing. */
  fromDrawer: boolean
  date: string
  /** The purchase order this pays, or null for the account in general. */
  orderId: number | null
  note: string
}

export interface OpenInvoice {
  orderId: number
  number: string
  remaining: number
}
