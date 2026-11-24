import { http, HttpResponse } from 'msw'
import type { ImportIssue, ImportPreview, ImportRequest, ImportRow } from '@/entities/product'
import { normalizeArabic } from '@/shared/lib/arabic-search'
import { apiUrl } from '../api-url'
import type { StoredProduct } from '../catalog-data'
import { db } from '../db'

const same = (a: string, b: string) => normalizeArabic(a) === normalizeArabic(b)
const ISO = /^\d{4}-\d{2}-\d{2}$/

/** The same checks the real server runs, one problem per row: the first that blocks it. */
function check(row: ImportRow): ImportIssue | null {
  const name = row.name?.trim() ?? ''
  const issue = (problem: ImportIssue['problem'], field: ImportIssue['field']): ImportIssue => ({
    line: row.line,
    name: name || '—',
    problem,
    field,
  })
  if (!name) return issue('nameMissing', 'name')
  if (!row.price) return issue('priceMissing', 'price')
  if (!Number.isFinite(Number(row.price)) || Number(row.price) <= 0) {
    return issue('priceInvalid', 'price')
  }
  const quantity = Number(row.quantity || 0)
  if (!Number.isFinite(quantity) || quantity < 0) return issue('quantityInvalid', 'quantity')
  if (quantity > 0) {
    if (!row.expiry) return issue('expiryMissing', 'expiry')
    if (!ISO.test(row.expiry) || Number.isNaN(Date.parse(row.expiry))) {
      return issue('expiryInvalid', 'expiry')
    }
    if (row.expiry <= db.today) return issue('expiryPast', 'expiry')
  }
  return null
}

function existing(row: ImportRow): StoredProduct | undefined {
  return row.barcode ? db.products.find((item) => item.barcode === row.barcode) : undefined
}

function newNames(rows: ImportRow[], field: 'category' | 'ingredient'): string[] {
  const known =
    field === 'category'
      ? db.categories.flatMap((item) => [item.nameAr, item.nameEn])
      : db.ingredients.map((item) => item.name)
  const found: string[] = []
  for (const row of rows) {
    const value = row[field]?.trim()
    if (!value) continue
    if (known.some((name) => same(name, value)) || found.some((name) => same(name, value))) {
      continue
    }
    found.push(value)
  }
  return found
}

function preview({ rows }: ImportRequest): ImportPreview {
  const issues: ImportIssue[] = []
  for (const row of rows) {
    const blocking = check(row)
    if (blocking) issues.push(blocking)
    else if (existing(row)) {
      issues.push({ line: row.line, name: row.name ?? '', problem: 'duplicate', field: 'barcode' })
    }
  }
  const valid = rows.filter((row) => !check(row))
  return {
    ready: valid.length,
    issues,
    newCategories: newNames(valid, 'category'),
    newIngredients: newNames(valid, 'ingredient'),
  }
}

export const importHandlers = [
  http.post(apiUrl('/api/imports/products/preview'), async ({ request }) => {
    const body = (await request.json()) as ImportRequest
    return HttpResponse.json({ data: preview(body) })
  }),

  http.post(apiUrl('/api/imports/products'), async ({ request }) => {
    const { rows, duplicates } = (await request.json()) as ImportRequest
    const id = Math.max(0, ...db.imports.map((item) => item.id)) + 1
    const record = {
      id,
      productIds: [] as number[],
      categoryIds: [] as number[],
      ingredientIds: [] as number[],
    }
    let added = 0
    let updated = 0
    let skipped = 0

    const categoryFor = (name: string | undefined) => {
      if (!name?.trim()) return null
      const found = db.categories.find((item) => same(item.nameAr, name) || same(item.nameEn, name))
      if (found) return found.id
      const created = {
        id: Math.max(0, ...db.categories.map((item) => item.id)) + 1,
        nameAr: name.trim(),
        nameEn: '',
      }
      db.categories.push(created)
      record.categoryIds.push(created.id)
      return created.id
    }
    const ingredientFor = (name: string | undefined) => {
      if (!name?.trim()) return null
      const found = db.ingredients.find((item) => same(item.name, name))
      if (found) return found.id
      const created = {
        id: Math.max(0, ...db.ingredients.map((item) => item.id)) + 1,
        name: name.trim(),
        nameAr: null,
        fromCatalog: false,
      }
      db.ingredients.push(created)
      record.ingredientIds.push(created.id)
      return created.id
    }

    for (const row of rows) {
      if (check(row)) {
        skipped += 1
        continue
      }
      const price = Number(row.price)
      const match = existing(row)
      if (match) {
        if (duplicates[row.line] === 'skip') {
          skipped += 1
          continue
        }
        match.units = match.units.map((unit, index) => (index === 0 ? { ...unit, price } : unit))
        updated += 1
        continue
      }
      const productId = Math.max(0, ...db.products.map((item) => item.id)) + 1
      const quantity = Number(row.quantity || 0)
      db.products.push({
        id: productId,
        name: row.name?.trim() ?? '',
        nameAr: row.nameAr?.trim() || null,
        ingredientId: ingredientFor(row.ingredient),
        categoryId: categoryFor(row.category),
        form: null,
        strength: '',
        manufacturer: row.manufacturer?.trim() ?? '',
        barcode: row.barcode || null,
        prescription: ['1', 'نعم', 'yes', 'true'].includes(normalizeArabic(row.prescription ?? '')),
        active: true,
        units: [{ name: 'علبة', perParent: null, price, enabled: true }],
        minStock: Number(row.minStock || db.settings.stock.defaultMinStock),
        supplierId: null,
        batches:
          quantity > 0 && row.expiry
            ? [
                {
                  code: `IMP-${id}-${row.line}`,
                  expiry: row.expiry,
                  quantity,
                  cost: Number(row.cost || 0),
                  supplierId: null,
                },
              ]
            : [],
        movements:
          quantity > 0
            ? [
                {
                  id: productId * 100,
                  at: new Date().toISOString(),
                  delta: quantity,
                  kind: 'import',
                  reference: `IMP-${id}`,
                  actor: 'رزان',
                },
              ]
            : [],
        dailySales: Array.from({ length: 30 }, () => 0),
        importId: id,
      })
      record.productIds.push(productId)
      added += 1
    }
    db.imports.push(record)
    return HttpResponse.json({
      data: {
        id,
        added,
        updated,
        skipped,
        newCategories: record.categoryIds.length,
        newIngredients: record.ingredientIds.length,
      },
    })
  }),

  http.post(apiUrl('/api/imports/:id/undo'), ({ params }) => {
    const record = db.imports.find((item) => item.id === Number(params.id))
    if (!record) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    const touched = db.products.some(
      (item) =>
        record.productIds.includes(item.id) &&
        item.movements.some((movement) => movement.kind === 'sale' || movement.kind === 'purchase'),
    )
    if (touched) return HttpResponse.json({ message: 'Already used.' }, { status: 409 })
    db.products = db.products.filter((item) => !record.productIds.includes(item.id))
    db.categories = db.categories.filter((item) => !record.categoryIds.includes(item.id))
    db.ingredients = db.ingredients.filter((item) => !record.ingredientIds.includes(item.id))
    db.imports = db.imports.filter((item) => item.id !== record.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
