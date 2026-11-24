export const SALE_PAYMENT_METHODS = ['cash', 'bank', 'credit', 'mixed'] as const
export type SalePaymentMethod = (typeof SALE_PAYMENT_METHODS)[number]

export const INVOICE_STATUSES = ['completed', 'partlyReturned', 'returned'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export interface InvoiceLine {
  productId: number
  name: string
  /** The batch it was sold from (nearest expiry first). */
  batch: string
  /** The unit it was sold in: box, strip, tablet. */
  unit: string
  quantity: number
  price: number
  total: number
  /** Already returned, in the same unit. */
  returned: number
}

export interface InvoicePayment {
  method: SalePaymentMethod
  cash: number
  bank: number
  credit: number
  /** Cash handed over, for the change. */
  received: number
  change: number
}

export interface Invoice {
  id: number
  number: string
  at: string
  shiftNumber: number
  customer: { id: number; name: string; phone: string } | null
  cashier: string
  lines: InvoiceLine[]
  subtotal: number
  discount: number
  total: number
  payment: InvoicePayment
  status: InvoiceStatus
  /** Null for staff who may not see purchase prices. */
  profit: number | null
  log: { at: string; text: string }[]
}

export interface InvoiceSummary {
  id: number
  number: string
  at: string
  customer: string | null
  cashier: string
  lineCount: number
  method: SalePaymentMethod
  total: number
  status: InvoiceStatus
}

export const INVOICE_PERIODS = ['today', 'yesterday', 'week', 'month'] as const
export type InvoicePeriod = (typeof INVOICE_PERIODS)[number]

export interface InvoiceFilters {
  period: InvoicePeriod
  cashierId: number | null
  method: SalePaymentMethod | null
  status: InvoiceStatus | null
  search: string
  page: number
}

export interface InvoicePage {
  data: InvoiceSummary[]
  meta: { total: number; page: number; perPage: number }
  totals: { count: number; total: number; cash: number; bank: number; credit: number }
}

/** A line in the cart, as the server needs it: which unit (by its place in the product's list). */
export interface SaleLineInput {
  productId: number
  unitIndex: number
  quantity: number
}

export interface SaleInput {
  lines: SaleLineInput[]
  discount: number
  customerId: number | null
  payment: {
    method: SalePaymentMethod
    cash: number
    bank: number
    credit: number
    received: number
  }
  /** The manager allowed going over the customer's debt limit. */
  overLimitApproved: boolean
}

/** A sale put aside to serve the next customer; it takes nothing from stock until paid. */
export interface HeldSale {
  id: number
  label: string
  at: string
  cashier: string
  customer: { id: number; name: string } | null
  discount: number
  lines: (SaleLineInput & { name: string })[]
  total: number
}

export interface HoldInput {
  label: string
  customerId: number | null
  discount: number
  lines: (SaleLineInput & { name: string })[]
  total: number
}
