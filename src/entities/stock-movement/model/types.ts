import type { MovementKind } from '@/entities/product/@x/stock-movement'

/** Where a movement came from, to open it: the invoice, the order, the count... */
export interface MovementLink {
  type: 'invoice' | 'order' | 'count' | 'damage' | 'return' | 'import'
  id: number
}

/** One line of the stock log. Written by the server; never edited or deleted. */
export interface MovementEntry {
  id: number
  at: string
  product: { id: number; name: string; unit: string }
  batch: string | null
  kind: MovementKind
  /** In the product's first unit: positive in, negative out. */
  delta: number
  balanceAfter: number | null
  reference: string | null
  link: MovementLink | null
  actor: string
}

export const MOVEMENT_PERIODS = [1, 7, 30, 90] as const
export type MovementPeriod = (typeof MOVEMENT_PERIODS)[number]

export interface MovementFilters {
  /** A staff member's id. */
  actorId: number | null
  days: MovementPeriod
  kind: MovementKind | null
}

export interface MovementTotals {
  in: number
  out: number
  /** Damage and count adjustments that took stock out: the losses. */
  losses: number
}
