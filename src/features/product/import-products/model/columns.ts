import type { ImportField, ImportRow } from '@/entities/product'
import { normalizeArabic } from '@/shared/lib/arabic-search'
import type { Table } from './table'

/** What a column is used for: a product field, or nothing. */
export type ColumnTarget = ImportField | 'ignore'

/**
 * The names people actually give their columns, in Arabic and English.
 * Matched after normalising, so "الاسم" and "اسم" and "Name " all count.
 */
const SYNONYMS: Record<ImportField, string[]> = {
  name: [
    'اسم الدواء',
    'اسم الصنف',
    'الاسم التجاري',
    'الصنف',
    'الدواء',
    'الاسم',
    'name',
    'product',
    'item',
    'trade name',
    'brand',
  ],
  nameAr: ['الاسم بالعربي', 'الاسم العربي', 'arabic name', 'name ar'],
  ingredient: [
    'المادة الفعالة',
    'المادة',
    'التركيبة',
    'ingredient',
    'active ingredient',
    'generic',
    'scientific name',
  ],
  category: ['التصنيف', 'القسم', 'الفئة', 'category', 'group', 'section'],
  barcode: ['الباركود', 'باركود', 'الرمز', 'barcode', 'ean', 'code'],
  price: ['سعر البيع', 'السعر', 'سعر', 'price', 'selling price', 'sale price'],
  quantity: ['الكمية', 'العدد', 'الرصيد', 'quantity', 'qty', 'stock'],
  expiry: ['تاريخ الانتهاء', 'الانتهاء', 'الصلاحية', 'expiry', 'expiry date', 'exp', 'expiration'],
  cost: ['سعر الشراء', 'التكلفة', 'الكلفة', 'cost', 'purchase price', 'buy price'],
  manufacturer: ['الشركة', 'الشركة المصنعة', 'المصنع', 'manufacturer', 'company', 'brand owner'],
  minStock: ['الحد الادنى', 'حد النقص', 'min', 'minimum', 'min stock', 'reorder level'],
  prescription: ['وصفة', 'بوصفة', 'يحتاج وصفة', 'prescription', 'rx'],
}

const LOOKUP = new Map<string, ImportField>(
  Object.entries(SYNONYMS).flatMap(([field, names]) =>
    names.map((name) => [normalizeArabic(name), field as ImportField] as const),
  ),
)

/** The field a header most likely means, or null when it is not clear. */
export function guessField(header: string): ImportField | null {
  return LOOKUP.get(normalizeArabic(header)) ?? null
}

/**
 * A first guess for every column. A field is only guessed once, so two columns never
 * fill the same field; unclear columns are left for the person to choose.
 */
export function guessMapping(headers: string[]): (ColumnTarget | null)[] {
  const used = new Set<ImportField>()
  return headers.map((header) => {
    const field = guessField(header)
    if (!field || used.has(field)) return null
    used.add(field)
    return field
  })
}

const ARABIC_DIGITS = /[٠-٩]/g
const EASTERN_DIGITS = /[۰-۹]/g

function latinDigits(text: string): string {
  return text
    .replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(EASTERN_DIGITS, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/٬/g, '')
}

/**
 * Dates as people write them: 2028-03-31, 31/03/2028, 03/2028 (the end of that month).
 * Anything else is passed on as typed, and the server says it cannot read it.
 */
export function normaliseDate(text: string): string {
  const value = latinDigits(text).trim()
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  const pad = (part: string | number) => String(part).padStart(2, '0')
  if (iso) return `${iso[1]}-${pad(iso[2]!)}-${pad(iso[3]!)}`
  const dayFirst = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value)
  if (dayFirst) return `${dayFirst[3]}-${pad(dayFirst[2]!)}-${pad(dayFirst[1]!)}`
  const monthYear = /^(\d{1,2})[/.-](\d{4})$/.exec(value)
  if (monthYear) {
    const year = Number(monthYear[2])
    const month = Number(monthYear[1])
    const lastDay = new Date(year, month, 0).getDate()
    return `${year}-${pad(month)}-${pad(lastDay)}`
  }
  return value
}

const NUMERIC: ImportField[] = ['price', 'quantity', 'cost', 'minStock', 'barcode']

/** The table as rows of product fields, in the person's matching. */
export function toImportRows(table: Table, mapping: (ColumnTarget | null)[]): ImportRow[] {
  return table.rows.map((cells, index) => {
    const row: ImportRow = { line: index + 2 }
    mapping.forEach((target, column) => {
      if (!target || target === 'ignore') return
      const raw = cells[column] ?? ''
      row[target] =
        target === 'expiry'
          ? normaliseDate(raw)
          : NUMERIC.includes(target)
            ? latinDigits(raw).replace(/[^\d.-]/g, '')
            : raw
    })
    return row
  })
}
