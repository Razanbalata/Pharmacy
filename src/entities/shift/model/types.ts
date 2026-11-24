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
