/** The product fields a spreadsheet column can be matched to. */
export const IMPORT_FIELDS = [
  'name',
  'nameAr',
  'ingredient',
  'category',
  'barcode',
  'price',
  'quantity',
  'expiry',
  'cost',
  'manufacturer',
  'minStock',
  'prescription',
] as const
export type ImportField = (typeof IMPORT_FIELDS)[number]

/** Without these a row cannot become a product. */
export const REQUIRED_IMPORT_FIELDS: readonly ImportField[] = ['name', 'price']

/** One spreadsheet row after the columns are matched. Values stay text; the server checks them. */
export type ImportRow = Partial<Record<ImportField, string>> & {
  /** The row number in the file, counting the header as 1, so people can find it. */
  line: number
}

export const IMPORT_PROBLEMS = [
  'nameMissing',
  'priceMissing',
  'priceInvalid',
  'quantityInvalid',
  'expiryMissing',
  'expiryInvalid',
  'expiryPast',
  'duplicate',
] as const
export type ImportProblem = (typeof IMPORT_PROBLEMS)[number]

/** A barcode that already exists: change the product we have, or leave that row out. */
export type DuplicateChoice = 'update' | 'skip'

export interface ImportIssue {
  line: number
  name: string
  problem: ImportProblem
  /** The field to fix, when fixing it here makes sense. */
  field: ImportField | null
}

export interface ImportPreview {
  ready: number
  issues: ImportIssue[]
  newCategories: string[]
  newIngredients: string[]
}

export interface ImportRequest {
  rows: ImportRow[]
  /** By line number; a duplicate without a choice is updated. */
  duplicates: Record<number, DuplicateChoice>
}

export interface ImportResult {
  id: number
  added: number
  updated: number
  skipped: number
  newCategories: number
  newIngredients: number
}
