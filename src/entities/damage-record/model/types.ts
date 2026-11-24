export const DAMAGE_REASONS = ['expired', 'broken', 'storage', 'customerReturn', 'other'] as const
export type DamageReason = (typeof DAMAGE_REASONS)[number]

/** Stock that left without being sold, and what it cost. */
export interface DamageRecord {
  id: number
  at: string
  product: { id: number; name: string; unit: string }
  batch: string
  quantity: number
  reason: DamageReason
  note: string
  /** Quantity × the batch's cost. */
  loss: number
  actor: string
}

/** An expired batch still counted in stock; it cannot be sold and should be written off. */
export interface ExpiredBatch {
  productId: number
  name: string
  unit: string
  batch: string
  expiry: string
  quantity: number
  cost: number
}

export interface DamageSummary {
  lossThisMonth: number
  lossLastMonth: number
  count: number
  topReason: { reason: DamageReason; count: number } | null
  expiredInStock: ExpiredBatch[]
}

export interface DamageInput {
  productId: number
  batch: string
  quantity: number
  reason: DamageReason
  note: string
}
