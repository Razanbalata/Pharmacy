export const COUNT_REASONS = ['unknown', 'unrecordedDamage', 'entryError', 'other'] as const
export type CountReason = (typeof COUNT_REASONS)[number]

export interface CountLine {
  productId: number
  name: string
  unit: string
  batch: string
  /**
   * What the system has now. Selling goes on during a count, so this follows the sales;
   * the difference is always against the latest number.
   */
  expected: number
  /** Null until counted. */
  actual: number | null
  reason: CountReason | null
  /** The batch's cost, to value the difference. */
  cost: number
}

export interface StockCount {
  id: number
  /** A category, or the whole pharmacy when null. */
  category: { id: number; nameAr: string; nameEn: string } | null
  status: 'open' | 'approved'
  startedAt: string
  startedBy: string
  approvedAt: string | null
  approvedBy: string | null
  lines: CountLine[]
}

export interface CountSummary {
  id: number
  category: StockCount['category']
  status: StockCount['status']
  startedAt: string
  startedBy: string
  approvedAt: string | null
  lineCount: number
  differences: number
  /** At cost; negative is a loss. */
  differenceValue: number
}

export interface CountLineInput {
  productId: number
  batch: string
  actual: number | null
  reason: CountReason | null
}
