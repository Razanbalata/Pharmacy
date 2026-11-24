/** Worked out by the server from quantity, minimum and the nearest expiry. */
export const STOCK_STATUSES = ['ok', 'low', 'soon', 'out', 'expired'] as const
export type StockStatus = (typeof STOCK_STATUSES)[number]

/** The tabs over the list: every stock status, plus products that were stopped. */
export const PRODUCT_TABS = ['all', 'low', 'soon', 'out', 'expired', 'stopped'] as const
export type ProductTab = (typeof PRODUCT_TABS)[number]

export const DOSAGE_FORMS = [
  'tablet',
  'capsule',
  'syrup',
  'injection',
  'cream',
  'drops',
  'inhaler',
  'sachet',
  'suppository',
  'other',
] as const
export type DosageForm = (typeof DOSAGE_FORMS)[number]

export const PRODUCT_SORTS = ['expiry', 'name', 'quantity'] as const
export type ProductSort = (typeof PRODUCT_SORTS)[number]

/**
 * One way to sell the product: box, strip, tablet. The first unit is the largest.
 * Stock is counted in the smallest enabled unit; the server converts.
 */
export interface SaleUnit {
  name: string
  /** How many of this unit fit in the unit above it. Null for the first unit. */
  perParent: number | null
  price: number
  enabled: boolean
}

export interface Ref {
  id: number
  name: string
}

export interface ProductSummary {
  id: number
  name: string
  nameAr: string | null
  ingredient: Ref | null
  category: { id: number; nameAr: string; nameEn: string } | null
  barcode: string | null
  prescription: boolean
  active: boolean
  /** In the first unit. */
  quantity: number
  /** The first unit's name, e.g. "علبة". */
  unit: string
  /** The batch that sells next. YYYY-MM-DD, or null when nothing is in stock. */
  nearestExpiry: string | null
  /** The first unit's price. */
  price: number
  status: StockStatus
}

export interface Product extends ProductSummary {
  form: DosageForm | null
  strength: string
  manufacturer: string
  units: SaleUnit[]
  /** In the first unit. Below this the product shows in the shortage alerts. */
  minStock: number
  supplier: Ref | null
}

export interface Batch {
  code: string
  expiry: string
  quantity: number
  /** Null for staff who may not see purchase prices. */
  cost: number | null
  supplier: string | null
  /** The batch the next sale takes from (nearest expiry first). */
  nextToSell: boolean
}

export const MOVEMENT_KINDS = [
  'sale',
  'purchase',
  'return',
  'count',
  'damage',
  'opening',
  'import',
] as const
export type MovementKind = (typeof MOVEMENT_KINDS)[number]

export interface Movement {
  id: number
  at: string
  /** Positive in, negative out, in the first unit. */
  delta: number
  kind: MovementKind
  reference: string | null
  actor: string
  /** The batch it touched, when known. */
  batch?: string | null
  /** The batch's quantity right after, when known. */
  balanceAfter?: number | null
}

export interface ProductDetail extends Product {
  /** Null for staff who may not see purchase prices. */
  averageCost: number | null
  soldLast30: number
  /** Units sold each day for the last 30 days, oldest first. */
  dailySales: number[]
  batches: Batch[]
  movements: Movement[]
  /** Other products with the same active ingredient. */
  alternatives: ProductSummary[]
}

export interface OpeningStock {
  quantity: number
  expiry: string
  cost: number
}

export interface ProductInput {
  name: string
  nameAr: string | null
  ingredientId: number | null
  categoryId: number | null
  form: DosageForm | null
  strength: string
  manufacturer: string
  barcode: string | null
  prescription: boolean
  units: SaleUnit[]
  minStock: number
  supplierId: number | null
  active: boolean
  /** Only when adding. After that, stock comes in through purchases. */
  opening: OpeningStock | null
}

export interface ProductFilters {
  tab: ProductTab
  categoryId: number | null
  ingredientId: number | null
  supplierId: number | null
  sort: ProductSort
  search: string
  page: number
  perPage: number
}

export interface ProductPage {
  data: ProductSummary[]
  meta: { total: number; page: number; perPage: number }
  counts: Record<ProductTab, number>
}

/** Only the fields that were ticked are sent; the rest stay as they are on each product. */
export interface BulkChanges {
  minStock?: number
  supplierId?: number
  categoryId?: number
  prescription?: boolean
  active?: boolean
  /** Raise (or lower, when negative) every enabled unit price by this percent. */
  pricePercent?: number
}

/** A drug from the shared list that every pharmacy can copy from. */
export interface CatalogEntry {
  id: number
  name: string
  nameAr: string | null
  /** Matched to this pharmacy's ingredients by the server, or null when it has none yet. */
  ingredient: Ref | null
  ingredientName: string
  form: DosageForm | null
  strength: string
  manufacturer: string
  barcode: string | null
  prescription: boolean
  units: SaleUnit[]
}
