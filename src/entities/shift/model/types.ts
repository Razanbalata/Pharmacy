/**
 * A cashier's shift on the till: opened with the cash counted in the drawer,
 * closed by counting it again. Nothing is sold without an open shift.
 */
export interface Shift {
  id: number
  number: number
  cashier: { id: number; name: string }
  openedAt: string
  closedAt: string | null
  openingCash: number
  status: 'open' | 'closed'
}

/** The cash story of a shift, line by line, ending in the cash the drawer should hold. */
export interface ShiftSummary {
  shift: Shift
  invoiceCount: number
  cashSales: number
  bankSales: number
  creditSales: number
  /** Cash given back for returns. */
  cashRefunds: number
  /** Cash taken from the drawer to pay suppliers. */
  supplierPayments: number
  /** Cash customers paid off their debt into the drawer. */
  debtPayments: number
  /** Cash taken from the drawer for expenses, like generator fuel. */
  expenses: number
  expectedCash: number
  /** Held invoices still waiting; the shift cannot close with them. */
  heldCount: number
}

export interface CurrentShift {
  shift: Shift | null
  /** Cash left in the drawer when the last shift closed, to check against when opening. */
  lastClosingCash: number | null
}

export interface CloseShiftInput {
  countedCash: number
  note: string
}

export interface ClosedShift {
  shift: Shift
  expectedCash: number
  countedCash: number
  difference: number
}

/** One shift in the log: what it sold, the cash it should have held, and what was counted. */
export interface ShiftRecord extends Shift {
  /** Everything sold in the shift: cash, bank app and credit. */
  sales: number
  /** Null while the shift is open. */
  expectedCash: number | null
  countedCash: number | null
  /** Counted minus expected: below zero is a shortage. Null while open. */
  difference: number | null
  note: string
}

export const SHIFT_PERIODS = ['today', 'week', 'month'] as const
export type ShiftPeriod = (typeof SHIFT_PERIODS)[number]

export interface ShiftFilters {
  period: ShiftPeriod
  /** The cashier's staff id, or null for everyone. */
  cashierId: number | null
  /** Only shifts closed with a difference. */
  withDifference: boolean
}

export interface ShiftLog {
  data: ShiftRecord[]
  summary: {
    open: { number: number; cashier: string } | null
    count: number
    /** The sum of all differences in the period, shortages and surpluses together. */
    totalDifference: number
    shortCount: number
  }
}
