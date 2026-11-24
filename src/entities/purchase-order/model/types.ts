import type { PaymentMethod } from '@/entities/supplier/@x/purchase-order'

export const ORDER_STATUSES = ['draft', 'sent', 'partial', 'received', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Worked out by the server from what was received and what was paid. */
export const PAYMENT_STATUSES = ['none', 'unpaid', 'partial', 'paid'] as const
export type OrderPaymentStatus = (typeof PAYMENT_STATUSES)[number]

export interface OrderLine {
  productId: number
  name: string
  /** The product's first unit, which quantities are in. */
  unit: string
  quantity: number
  cost: number
  /** Received so far, over all deliveries. */
  received: number
  /** Stock and minimum when the order was opened, to judge the quantity. */
  stock: number
  minStock: number
}

export interface PurchaseOrder {
  id: number
  number: string
  supplier: { id: number; name: string; phone: string }
  status: OrderStatus
  paymentStatus: OrderPaymentStatus
  createdAt: string
  sentAt: string | null
  lines: OrderLine[]
  note: string
  /** Value of what was ordered. */
  total: number
  /** Value of what arrived, which is what is owed. */
  receivedTotal: number
  paid: number
}

export interface OrderSummary {
  id: number
  number: string
  supplier: { id: number; name: string }
  status: OrderStatus
  paymentStatus: OrderPaymentStatus
  createdAt: string
  lineCount: number
  total: number
}

export interface OrderFilters {
  supplierId: number | null
  status: OrderStatus | null
  payment: OrderPaymentStatus | null
  /** Days back from today. */
  days: 30 | 90 | 365
}

export interface OrderInput {
  supplierId: number
  lines: { productId: number; quantity: number; cost: number }[]
  note: string
}

/** A product below its minimum, grouped under its usual supplier. */
export interface SuggestedLine {
  productId: number
  name: string
  unit: string
  stock: number
  minStock: number
  /** Enough to reach twice the minimum. */
  quantity: number
  cost: number
}

export interface Suggestion {
  supplier: { id: number; name: string }
  lines: SuggestedLine[]
}

export interface ReceiveLineInput {
  productId: number
  received: number
  batch: string
  expiry: string
  cost: number
}

export interface ReceiveInput {
  supplierInvoice: string
  lines: ReceiveLineInput[]
  payment: { amount: number; method: PaymentMethod; fromDrawer: boolean }
}

export interface ReceiveResult {
  status: OrderStatus
  receivedValue: number
  paid: number
  addedToAccount: number
}
