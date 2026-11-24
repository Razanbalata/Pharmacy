import { http, HttpResponse } from 'msw'
import type { Category, CategoryInput } from '@/entities/category'
import type { Ingredient, IngredientInput } from '@/entities/ingredient'
import type {
  BulkChanges,
  ProductDetail,
  ProductInput,
  ProductSummary,
  ProductTab,
  StockStatus,
} from '@/entities/product'
import { PRODUCT_TABS } from '@/entities/product'
import { matchesSearch, normalizeArabic } from '@/shared/lib/arabic-search'
import { internalEan13 } from '@/shared/lib/barcode'
import { daysUntil } from '@/shared/lib/date'
import { roundMoney } from '@/shared/lib/money'
import { logActivity } from '../activity-log'
import { apiUrl } from '../api-url'
import type { StoredProduct } from '../catalog-data'
import { db } from '../db'
import { mockRole } from '../fixtures'

function today(): Date {
  return new Date(`${db.today}T12:00:00`)
}

export function quantityOf(product: StoredProduct): number {
  return product.batches.reduce((sum, item) => sum + item.quantity, 0)
}

function nearestExpiry(product: StoredProduct): string | null {
  const dates = product.batches
    .filter((item) => item.quantity > 0)
    .map((item) => item.expiry)
    .sort()
  return dates[0] ?? null
}

/** The same rule the real server uses: nothing, expired, expiring, short, fine. */
export function statusOf(product: StoredProduct): StockStatus {
  const quantity = quantityOf(product)
  const expiry = nearestExpiry(product)
  if (quantity === 0 || !expiry) return 'out'
  const days = daysUntil(expiry, today())
  if (days < 0) return 'expired'
  if (days <= db.settings.stock.expiryAlertDays) return 'soon'
  if (quantity <= product.minStock) return 'low'
  return 'ok'
}

function summary(product: StoredProduct): ProductSummary {
  const ingredient = db.ingredients.find((item) => item.id === product.ingredientId)
  const category = db.categories.find((item) => item.id === product.categoryId)
  const first = product.units[0]
  return {
    id: product.id,
    name: product.name,
    nameAr: product.nameAr,
    ingredient: ingredient ? { id: ingredient.id, name: ingredient.name } : null,
    category: category ?? null,
    barcode: product.barcode,
    prescription: product.prescription,
    active: product.active,
    quantity: quantityOf(product),
    unit: first?.name ?? '',
    nearestExpiry: nearestExpiry(product),
    price: first?.price ?? 0,
    status: statusOf(product),
  }
}

function supplierRef(id: number | null) {
  const supplier = db.suppliers.find((item) => item.id === id)
  return supplier ? { id: supplier.id, name: supplier.name } : null
}

function detail(product: StoredProduct): ProductDetail {
  const seesCost = mockRole() !== 'cashier'
  const quantity = quantityOf(product)
  const next = nearestExpiry(product)
  const averageCost =
    quantity === 0
      ? null
      : roundMoney(
          product.batches.reduce((sum, item) => sum + item.cost * item.quantity, 0) / quantity,
        )
  return {
    ...summary(product),
    form: product.form,
    strength: product.strength,
    manufacturer: product.manufacturer,
    units: product.units,
    minStock: product.minStock,
    supplier: supplierRef(product.supplierId),
    averageCost: seesCost ? averageCost : null,
    soldLast30: product.dailySales.reduce((sum, day) => sum + day, 0),
    dailySales: product.dailySales,
    batches: [...product.batches]
      .filter((item) => item.quantity > 0)
      .sort((a, b) => a.expiry.localeCompare(b.expiry))
      .map((item) => ({
        code: item.code,
        expiry: item.expiry,
        quantity: item.quantity,
        cost: seesCost ? item.cost : null,
        supplier: supplierRef(item.supplierId)?.name ?? null,
        nextToSell: item.expiry === next,
      })),
    movements: [...product.movements].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10),
    alternatives:
      product.ingredientId === null
        ? []
        : db.products
            .filter(
              (item) =>
                item.id !== product.id && item.ingredientId === product.ingredientId && item.active,
            )
            .map(summary),
  }
}

function inTab(product: StoredProduct, tab: ProductTab): boolean {
  if (tab === 'stopped') return !product.active
  if (!product.active) return false
  return tab === 'all' || statusOf(product) === tab
}

function invalid(field: string, code: string) {
  return HttpResponse.json(
    { message: 'The given data was invalid.', errors: { [field]: [code] } },
    { status: 422 },
  )
}

function notFound() {
  return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
}

function barcodeTaken(barcode: string | null, exceptId?: number): boolean {
  return (
    barcode !== null && db.products.some((item) => item.barcode === barcode && item.id !== exceptId)
  )
}

function applyInput(product: StoredProduct, input: ProductInput): void {
  product.name = input.name.trim()
  product.nameAr = input.nameAr?.trim() || null
  product.ingredientId = input.ingredientId
  product.categoryId = input.categoryId
  product.form = input.form
  product.strength = input.strength
  product.manufacturer = input.manufacturer
  product.barcode = input.barcode?.trim() || null
  product.prescription = input.prescription
  product.units = input.units
  product.minStock = input.minStock
  product.supplierId = input.supplierId
  product.active = input.active
}

function nextId(list: { id: number }[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1
}

function categoryWithCounts(category: (typeof db.categories)[number]): Category {
  const products = db.products.filter((item) => item.categoryId === category.id)
  return {
    ...category,
    productCount: products.length,
    lowCount: products.filter((item) => item.active && statusOf(item) === 'low').length,
  }
}

function ingredientWithCounts(ingredient: (typeof db.ingredients)[number]): Ingredient {
  // Stopped products are not offered as alternatives, so they are not counted here.
  const products = db.products.filter((item) => item.ingredientId === ingredient.id && item.active)
  return {
    ...ingredient,
    productCount: products.length,
    inStockCount: products.filter((item) => quantityOf(item) > 0).length,
  }
}

const same = (a: string, b: string) => normalizeArabic(a) === normalizeArabic(b)

export const catalogHandlers = [
  http.get(apiUrl('/api/products'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const tab = (query.get('tab') ?? 'all') as ProductTab
    const category = query.get('category')
    const ingredient = query.get('ingredient')
    const supplier = query.get('supplier')
    const search = query.get('search') ?? ''
    const sort = query.get('sort') ?? 'expiry'
    const page = Number(query.get('page') ?? 1)
    const perPage = Number(query.get('perPage') ?? 25)

    const filtered = db.products.filter(
      (item) =>
        (!category || item.categoryId === Number(category)) &&
        (!ingredient || item.ingredientId === Number(ingredient)) &&
        (!supplier || item.supplierId === Number(supplier)) &&
        (!search ||
          matchesSearch(
            `${item.name} ${item.nameAr ?? ''} ${item.barcode ?? ''} ${db.ingredients.find((entry) => entry.id === item.ingredientId)?.name ?? ''}`,
            search,
          ) ||
          item.barcode === search.trim()),
    )
    const counts = Object.fromEntries(
      PRODUCT_TABS.map((name) => [name, filtered.filter((item) => inTab(item, name)).length]),
    ) as Record<ProductTab, number>

    const rows = filtered.filter((item) => inTab(item, tab)).map(summary)
    rows.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'quantity') return a.quantity - b.quantity
      return (a.nearestExpiry ?? '9999').localeCompare(b.nearestExpiry ?? '9999')
    })

    return HttpResponse.json({
      data: rows.slice((page - 1) * perPage, page * perPage),
      meta: { total: rows.length, page, perPage },
      counts,
    })
  }),

  http.post(apiUrl('/api/products/bulk'), async ({ request }) => {
    const { ids, changes } = (await request.json()) as { ids: number[]; changes: BulkChanges }
    for (const product of db.products.filter((item) => ids.includes(item.id))) {
      if (changes.minStock !== undefined) product.minStock = changes.minStock
      if (changes.supplierId !== undefined) product.supplierId = changes.supplierId
      if (changes.categoryId !== undefined) product.categoryId = changes.categoryId
      if (changes.prescription !== undefined) product.prescription = changes.prescription
      if (changes.active !== undefined) product.active = changes.active
      if (changes.pricePercent !== undefined) {
        const factor = 1 + changes.pricePercent / 100
        product.units = product.units.map((unit) => ({
          ...unit,
          price: roundMoney(unit.price * factor),
        }))
      }
    }
    logActivity({
      kind: 'sensitive',
      event: 'bulkEdit',
      params: { count: ids.length },
      detail: null,
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('/api/products/:id'), ({ params }) => {
    const product = db.products.find((item) => item.id === Number(params.id))
    return product ? HttpResponse.json({ data: detail(product) }) : notFound()
  }),

  http.post(apiUrl('/api/products'), async ({ request }) => {
    const input = (await request.json()) as ProductInput
    if (barcodeTaken(input.barcode)) return invalid('barcode', 'taken')
    const id = nextId(db.products)
    const product: StoredProduct = {
      id,
      name: '',
      nameAr: null,
      ingredientId: null,
      categoryId: null,
      form: null,
      strength: '',
      manufacturer: '',
      barcode: null,
      prescription: false,
      active: true,
      units: [],
      minStock: 0,
      supplierId: null,
      batches: [],
      movements: [],
      dailySales: Array.from({ length: 30 }, () => 0),
    }
    applyInput(product, input)
    if (input.opening && input.opening.quantity > 0) {
      product.batches.push({
        code: `OPEN-${id}`,
        expiry: input.opening.expiry,
        quantity: input.opening.quantity,
        cost: input.opening.cost,
        supplierId: input.supplierId,
      })
      product.movements.push({
        id: id * 100,
        at: new Date().toISOString(),
        delta: input.opening.quantity,
        kind: 'opening',
        reference: null,
        actor: 'رزان',
      })
    }
    db.products.push(product)
    return HttpResponse.json({ data: detail(product) }, { status: 201 })
  }),

  http.put(apiUrl('/api/products/:id'), async ({ params, request }) => {
    const product = db.products.find((item) => item.id === Number(params.id))
    if (!product) return notFound()
    const input = (await request.json()) as ProductInput
    if (barcodeTaken(input.barcode, product.id)) return invalid('barcode', 'taken')
    applyInput(product, input)
    return HttpResponse.json({ data: detail(product) })
  }),

  http.post(apiUrl('/api/products/:id/barcode'), ({ params }) => {
    const product = db.products.find((item) => item.id === Number(params.id))
    if (!product) return notFound()
    product.barcode ??= internalEan13(product.id)
    return HttpResponse.json({ data: { barcode: product.barcode } })
  }),

  http.get(apiUrl('/api/catalog'), ({ request }) => {
    const search = new URL(request.url).searchParams.get('search') ?? ''
    const found = db.catalog
      .filter(
        (entry) =>
          matchesSearch(`${entry.name} ${entry.nameAr ?? ''}`, search) || entry.barcode === search,
      )
      .map((entry) => {
        const match = db.ingredients.find((item) => same(item.name, entry.ingredientName))
        return { ...entry, ingredient: match ? { id: match.id, name: match.name } : null }
      })
    return HttpResponse.json({ data: found })
  }),

  http.get(apiUrl('/api/categories'), () =>
    HttpResponse.json({ data: db.categories.map(categoryWithCounts) }),
  ),

  http.post(apiUrl('/api/categories'), async ({ request }) => {
    const input = (await request.json()) as CategoryInput
    if (db.categories.some((item) => same(item.nameAr, input.nameAr))) {
      return invalid('nameAr', 'taken')
    }
    const category = { id: nextId(db.categories), ...input }
    db.categories.push(category)
    return HttpResponse.json({ data: categoryWithCounts(category) }, { status: 201 })
  }),

  http.put(apiUrl('/api/categories/:id'), async ({ params, request }) => {
    const category = db.categories.find((item) => item.id === Number(params.id))
    if (!category) return notFound()
    const input = (await request.json()) as CategoryInput
    if (db.categories.some((item) => item.id !== category.id && same(item.nameAr, input.nameAr))) {
      return invalid('nameAr', 'taken')
    }
    Object.assign(category, input)
    return HttpResponse.json({ data: categoryWithCounts(category) })
  }),

  http.post(apiUrl('/api/categories/:id/merge'), async ({ params, request }) => {
    const id = Number(params.id)
    const { targetId } = (await request.json()) as { targetId: number }
    if (id === targetId || !db.categories.some((item) => item.id === targetId)) {
      return invalid('targetId', 'invalid')
    }
    for (const product of db.products) if (product.categoryId === id) product.categoryId = targetId
    db.categories = db.categories.filter((item) => item.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(apiUrl('/api/categories/:id'), ({ params }) => {
    const id = Number(params.id)
    if (db.products.some((item) => item.categoryId === id)) {
      return HttpResponse.json({ message: 'The category has products.' }, { status: 409 })
    }
    db.categories = db.categories.filter((item) => item.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('/api/ingredients'), () =>
    HttpResponse.json({
      data: db.ingredients.map(ingredientWithCounts).sort((a, b) => a.name.localeCompare(b.name)),
    }),
  ),

  http.get(apiUrl('/api/ingredients/duplicates'), () => {
    const keep = db.ingredients.find((item) => item.id === 1)
    const merge = db.ingredients.find((item) => item.id === 3)
    return HttpResponse.json({
      data:
        keep && merge
          ? [{ keep: { id: keep.id, name: keep.name }, merge: { id: merge.id, name: merge.name } }]
          : [],
    })
  }),

  http.post(apiUrl('/api/ingredients'), async ({ request }) => {
    const input = (await request.json()) as IngredientInput
    if (db.ingredients.some((item) => same(item.name, input.name))) return invalid('name', 'taken')
    const ingredient = { id: nextId(db.ingredients), ...input, fromCatalog: false }
    db.ingredients.push(ingredient)
    return HttpResponse.json({ data: ingredientWithCounts(ingredient) }, { status: 201 })
  }),

  http.put(apiUrl('/api/ingredients/:id'), async ({ params, request }) => {
    const ingredient = db.ingredients.find((item) => item.id === Number(params.id))
    if (!ingredient) return notFound()
    const input = (await request.json()) as IngredientInput
    if (db.ingredients.some((item) => item.id !== ingredient.id && same(item.name, input.name))) {
      return invalid('name', 'taken')
    }
    Object.assign(ingredient, input)
    return HttpResponse.json({ data: ingredientWithCounts(ingredient) })
  }),

  http.post(apiUrl('/api/ingredients/:id/merge'), async ({ params, request }) => {
    const id = Number(params.id)
    const { targetId } = (await request.json()) as { targetId: number }
    if (id === targetId || !db.ingredients.some((item) => item.id === targetId)) {
      return invalid('targetId', 'invalid')
    }
    for (const product of db.products) {
      if (product.ingredientId === id) product.ingredientId = targetId
    }
    db.ingredients = db.ingredients.filter((item) => item.id !== id)
    return new HttpResponse(null, { status: 204 })
  }),
]
