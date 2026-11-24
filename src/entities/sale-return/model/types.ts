export const RETURN_REASONS = ['notNeeded', 'wrongItem', 'damaged', 'sideEffects', 'other'] as const
export type ReturnReason = (typeof RETURN_REASONS)[number]

/** Back on the shelf, or written off when it cannot be sold again. */
export type ReturnDestination = 'stock' | 'damage'

/** How the money goes back: from the drawer, by bank app, or off the customer's debt. */
export type RefundMethod = 'cash' | 'bank' | 'debt'

export interface ReturnLineInput {
  productId: number
  batch: string
  quantity: number
  reason: ReturnReason
  destination: ReturnDestination
}

export interface ReturnInput {
  invoiceId: number
  lines: ReturnLineInput[]
  refund: RefundMethod
  /** The pharmacist or manager who approved it; a cashier cannot return alone. */
  approverId: number
}

export interface SaleReturn {
  id: number
  number: string
  invoiceNumber: string
  amount: number
  refund: RefundMethod
}
