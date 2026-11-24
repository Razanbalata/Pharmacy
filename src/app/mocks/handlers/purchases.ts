import { http, HttpResponse } from 'msw'
import type {
  OrderInput,
  OrderPaymentStatus,
  OrderSummary,
  PurchaseOrder,
  ReceiveInput,
  Suggestion,
} from '@/entities/purchase-order'
import type {
  StatementLine,
  StatementPeriod,
  Supplier,
  SupplierInput,
  SupplierPaymentInput,
} from '@/entities/supplier'
import { normalizeArabic } from '@/shared/lib/arabic-search'
import { daysUntil } from '@/shared/lib/date'
import { roundMoney } from '@/shared/lib/money'
import { apiUrl } from '../api-url'
import { db } from '../db'
import type { LedgerEntry, StoredOrder } from '../purchases-data'
import { quantityOf, statusOf } from './catalog'

const DAY_MS = 86_400_000

function invalid(field: string, code: string) {
  return HttpResponse.json(
    { message: 'The given data was invalid.', errors: { [field]: [code] } },
    { status: 422 },
  )
}
const notFound = () => HttpResponse.json({ message: 'Not found.' }, { status: 404 })
const conflict = () => HttpResponse.json({ message: 'Not allowed now.' }, { status: 409 })

function balanceOf(supplierId: number, until = '9999-12-31'): number {
  return roundMoney(
    db.ledger
      .filter((entry) => entry.supplierId === supplierId && entry.date <= until)
      .reduce((sum, entry) => sum + (entry.kind === 'invoice' ? entry.amount : -entry.amount), 0),
  )
}

function orderTotals(order: StoredOrder) {
  const total = roundMoney(order.lines.reduce((sum, line) => sum + line.quantity * line.cost, 0))
  const receivedTotal = roundMoney(
    order.lines.reduce((sum, line) => sum + line.received * line.cost, 0),
  )
  const payment: OrderPaymentStatus =
    receivedTotal === 0
      ? 'none'
      : order.paid >= receivedTotal
        ? 'paid'
        : order.paid > 0
          ? 'partial'
          : 'unpaid'
  return { total, receivedTotal, payment }
}

function supplierView(id: number): Supplier | null {
  const supplier = db.suppliers.find((item) => item.id === id)
  if (!supplier) return null
  const orders = db.orders
    .filter((order) => order.supplierId === id && order.status !== 'draft')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const last = orders[0]
  return {
    ...supplier,
    balance: balanceOf(id),
    lastOrder: last ? { id: last.id, number: last.number, date: last.createdAt } : null,
    ordersThisYear: orders.filter((order) => order.createdAt.startsWith(db.today.slice(0, 4)))
      .length,
  }
}

function summary(order: StoredOrder): OrderSummary {
  const supplier = db.suppliers.find((item) => item.id === order.supplierId)
  const { total, payment } = orderTotals(order)
  return {
    id: order.id,
    number: order.number,
    supplier: { id: order.supplierId, name: supplier?.name ?? '' },
    status: order.status,
    paymentStatus: payment,
    createdAt: order.createdAt,
    lineCount: order.lines.length,
    total,
  }
}

function detail(order: StoredOrder): PurchaseOrder {
  const supplier = db.suppliers.find((item) => item.id === order.supplierId)
  const { total, receivedTotal, payment } = orderTotals(order)
  return {
    id: order.id,
    number: order.number,
    supplier: { id: order.supplierId, name: supplier?.name ?? '', phone: supplier?.phone ?? '' },
    status: order.status,
    paymentStatus: payment,
    createdAt: order.createdAt,
    sentAt: order.sentAt,
    note: order.note,
    total,
    receivedTotal,
    paid: order.paid,
    lines: order.lines.map((line) => {
      const product = db.products.find((item) => item.id === line.productId)
      return {
        ...line,
        name: product?.name ?? '',
        unit: product?.units[0]?.name ?? '',
        stock: product ? quantityOf(product) : 0,
        minStock: product?.minStock ?? 0,
      }
    }),
  }
}

/** The cost to suggest: the last batch from any supplier, or a guess from the price. */
function lastCost(productId: number): number {
  const product = db.products.find((item) => item.id === productId)
  const batch = product?.batches.at(-1)
  if (batch) return batch.cost
  return roundMoney((product?.units[0]?.price ?? 0) * 0.7)
}

function nextOrderNumber(): { id: number; number: string } {
  const id = Math.max(0, ...db.orders.map((order) => order.id)) + 1
  return { id, number: `PO-${String(id).padStart(4, '0')}` }
}

function suggestions(): Suggestion[] {
  const onOrder = new Set(
    db.orders
      .filter((order) => order.status === 'draft' || order.status === 'sent')
      .flatMap((order) => order.lines.map((line) => line.productId)),
  )
  const groups = new Map<number, Suggestion>()
  for (const product of db.products) {
    if (!product.active || product.supplierId === null || onOrder.has(product.id)) continue
    const status = statusOf(product)
    const quantity = quantityOf(product)
    if (status !== 'low' && status !== 'out' && quantity > product.minStock) continue
    const supplier = db.suppliers.find((item) => item.id === product.supplierId)
    if (!supplier) continue
    const group = groups.get(supplier.id) ?? {
      supplier: { id: supplier.id, name: supplier.name },
      lines: [],
    }
    group.lines.push({
      productId: product.id,
      name: product.name,
      unit: product.units[0]?.name ?? '',
      stock: quantity,
      minStock: product.minStock,
      quantity: Math.max(1, product.minStock * 2 - quantity),
      cost: lastCost(product.id),
    })
    groups.set(supplier.id, group)
  }
  return [...groups.values()]
}

function periodStart(period: StatementPeriod): string {
  const today = new Date(`${db.today}T00:00:00Z`)
  if (period === 'month') return `${db.today.slice(0, 7)}-01`
  if (period === 'year') return `${db.today.slice(0, 4)}-01-01`
  return new Date(today.getTime() - 90 * DAY_MS).toISOString().slice(0, 10)
}

function nextReceipt(): string {
  const count = db.ledger.filter((entry) => entry.kind === 'payment').length + 31
  return `RV-${String(count).padStart(4, '0')}`
}

function addLedger(entry: Omit<LedgerEntry, 'id'>): void {
  db.ledger.push({ ...entry, id: Math.max(0, ...db.ledger.map((item) => item.id)) + 1 })
}

function validSupplier(input: SupplierInput, exceptId?: number) {
  if (
    db.suppliers.some(
      (item) => item.id !== exceptId && normalizeArabic(item.name) === normalizeArabic(input.name),
    )
  ) {
    return invalid('name', 'taken')
  }
  return null
}

export const purchaseHandlers = [
  http.get(apiUrl('/api/suppliers/options'), () =>
    HttpResponse.json({ data: db.suppliers.map(({ id, name }) => ({ id, name })) }),
  ),

  http.get(apiUrl('/api/suppliers'), () => {
    const month = db.today.slice(0, 7)
    return HttpResponse.json({
      data: db.suppliers.map((item) => supplierView(item.id)).filter(Boolean),
      summary: {
        totalOwed: roundMoney(db.suppliers.reduce((sum, item) => sum + balanceOf(item.id), 0)),
        purchasesThisMonth: roundMoney(
          db.ledger
            .filter((entry) => entry.kind === 'invoice' && entry.date.startsWith(month))
            .reduce((sum, entry) => sum + entry.amount, 0),
        ),
        awaitingDelivery: db.orders.filter(
          (order) => order.status === 'sent' || order.status === 'partial',
        ).length,
      },
    })
  }),

  http.post(apiUrl('/api/suppliers'), async ({ request }) => {
    const input = (await request.json()) as SupplierInput
    const refused = validSupplier(input)
    if (refused) return refused
    const id = Math.max(0, ...db.suppliers.map((item) => item.id)) + 1
    db.suppliers.push({ ...input, id })
    return HttpResponse.json({ data: supplierView(id) }, { status: 201 })
  }),

  http.put(apiUrl('/api/suppliers/:id'), async ({ params, request }) => {
    const supplier = db.suppliers.find((item) => item.id === Number(params.id))
    if (!supplier) return notFound()
    const input = (await request.json()) as SupplierInput
    const refused = validSupplier(input, supplier.id)
    if (refused) return refused
    Object.assign(supplier, input)
    return HttpResponse.json({ data: supplierView(supplier.id) })
  }),

  http.get(apiUrl('/api/suppliers/:id/statement'), ({ params, request }) => {
    const id = Number(params.id)
    const supplier = supplierView(id)
    if (!supplier) return notFound()
    const period = (new URL(request.url).searchParams.get('period') ?? 'month') as StatementPeriod
    const from = periodStart(period)
    const dayBefore = new Date(Date.parse(`${from}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10)
    const openingBalance = balanceOf(id, dayBefore)
    let running = openingBalance
    const lines: StatementLine[] = db.ledger
      .filter((entry) => entry.supplierId === id && entry.date >= from)
      .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
      .map((entry) => {
        const debit = entry.kind === 'invoice' ? entry.amount : 0
        const credit = entry.kind === 'payment' ? entry.amount : 0
        running = roundMoney(running + debit - credit)
        return {
          id: entry.id,
          date: entry.date,
          kind: entry.kind,
          reference: entry.reference,
          orderId: entry.kind === 'invoice' ? entry.orderId : null,
          detail: entry.detail,
          method: entry.method,
          debit,
          credit,
          balance: running,
        }
      })
    const draft = db.orders.find((order) => order.supplierId === id && order.status === 'draft')
    return HttpResponse.json({
      data: {
        supplier,
        period,
        from,
        openingBalance,
        lines,
        purchases: roundMoney(lines.reduce((sum, item) => sum + item.debit, 0)),
        paid: roundMoney(lines.reduce((sum, item) => sum + item.credit, 0)),
        draft: draft ? { id: draft.id, number: draft.number } : null,
      },
    })
  }),

  http.get(apiUrl('/api/suppliers/:id/open-invoices'), ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json({
      data: db.orders
        .filter((order) => order.supplierId === id)
        .map((order) => ({ order, remaining: orderTotals(order).receivedTotal - order.paid }))
        .filter(({ remaining }) => remaining > 0)
        .map(({ order, remaining }) => ({
          orderId: order.id,
          number: order.number,
          remaining: roundMoney(remaining),
        })),
    })
  }),

  http.post(apiUrl('/api/suppliers/:id/payments'), async ({ params, request }) => {
    const id = Number(params.id)
    if (!db.suppliers.some((item) => item.id === id)) return notFound()
    const input = (await request.json()) as SupplierPaymentInput
    if (!(input.amount > 0)) return invalid('amount', 'positive')
    if (input.amount > balanceOf(id) + 0.001) return invalid('amount', 'tooMuch')
    const receipt = nextReceipt()
    const order = db.orders.find((item) => item.id === input.orderId)
    if (order) order.paid = roundMoney(order.paid + input.amount)
    addLedger({
      supplierId: id,
      date: input.date,
      kind: 'payment',
      reference: receipt,
      orderId: input.orderId,
      detail: [input.note, input.fromDrawer ? 'من درج الوردية' : '', 'رزان']
        .filter(Boolean)
        .join(' · '),
      method: input.method,
      fromDrawer: input.fromDrawer,
      amount: input.amount,
    })
    return HttpResponse.json({ data: { receipt, balance: balanceOf(id) } }, { status: 201 })
  }),

  http.get(apiUrl('/api/purchases/suggestions'), () => HttpResponse.json({ data: suggestions() })),

  http.post(apiUrl('/api/purchases/suggestions'), async ({ request }) => {
    const { supplierIds } = (await request.json()) as { supplierIds: number[] }
    const made: OrderSummary[] = []
    for (const group of suggestions().filter((item) => supplierIds.includes(item.supplier.id))) {
      const { id, number } = nextOrderNumber()
      const order: StoredOrder = {
        id,
        number,
        supplierId: group.supplier.id,
        status: 'draft',
        createdAt: new Date().toISOString(),
        sentAt: null,
        note: '',
        paid: 0,
        lines: group.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          cost: line.cost,
          received: 0,
        })),
      }
      db.orders.push(order)
      made.push(summary(order))
    }
    return HttpResponse.json({ data: made }, { status: 201 })
  }),

  http.get(apiUrl('/api/purchases'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const supplier = query.get('supplier')
    const status = query.get('status')
    const payment = query.get('payment')
    const days = Number(query.get('days') ?? 30)
    const since = Date.parse(`${db.today}T23:59:59Z`) - days * DAY_MS
    const list = db.orders
      .filter(
        (order) =>
          Date.parse(order.createdAt) >= since &&
          (!supplier || order.supplierId === Number(supplier)) &&
          (!status || order.status === status),
      )
      .map(summary)
      .filter((order) => !payment || order.paymentStatus === payment)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json({ data: list })
  }),

  http.get(apiUrl('/api/purchases/:id'), ({ params }) => {
    const order = db.orders.find((item) => item.id === Number(params.id))
    return order ? HttpResponse.json({ data: detail(order) }) : notFound()
  }),

  http.post(apiUrl('/api/purchases'), async ({ request }) => {
    const input = (await request.json()) as OrderInput
    if (input.lines.length === 0) return invalid('lines', 'required')
    const { id, number } = nextOrderNumber()
    const order: StoredOrder = {
      id,
      number,
      supplierId: input.supplierId,
      status: 'draft',
      createdAt: new Date().toISOString(),
      sentAt: null,
      note: input.note,
      paid: 0,
      lines: input.lines.map((line) => ({ ...line, received: 0 })),
    }
    db.orders.push(order)
    return HttpResponse.json({ data: detail(order) }, { status: 201 })
  }),

  http.put(apiUrl('/api/purchases/:id'), async ({ params, request }) => {
    const order = db.orders.find((item) => item.id === Number(params.id))
    if (!order) return notFound()
    if (order.status !== 'draft') return conflict()
    const input = (await request.json()) as OrderInput
    if (input.lines.length === 0) return invalid('lines', 'required')
    order.supplierId = input.supplierId
    order.note = input.note
    order.lines = input.lines.map((line) => ({ ...line, received: 0 }))
    return HttpResponse.json({ data: detail(order) })
  }),

  http.post(apiUrl('/api/purchases/:id/send'), ({ params }) => {
    const order = db.orders.find((item) => item.id === Number(params.id))
    if (!order) return notFound()
    if (order.status !== 'draft') return conflict()
    order.status = 'sent'
    order.sentAt = new Date().toISOString()
    return HttpResponse.json({ data: detail(order) })
  }),

  http.post(apiUrl('/api/purchases/:id/cancel'), ({ params }) => {
    const order = db.orders.find((item) => item.id === Number(params.id))
    if (!order) return notFound()
    const nothingArrived = order.lines.every((line) => line.received === 0)
    if (!['draft', 'sent'].includes(order.status) || !nothingArrived) return conflict()
    order.status = 'cancelled'
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiUrl('/api/purchases/:id/receive'), async ({ params, request }) => {
    const order = db.orders.find((item) => item.id === Number(params.id))
    if (!order) return notFound()
    if (order.status !== 'sent' && order.status !== 'partial') return conflict()
    const input = (await request.json()) as ReceiveInput
    const arriving = input.lines.filter((line) => line.received > 0)
    if (arriving.length === 0) return invalid('lines', 'required')
    for (const [index, line] of input.lines.entries()) {
      if (line.received <= 0) continue
      if (!line.batch.trim()) return invalid(`lines.${index}.batch`, 'required')
      if (!line.expiry || daysUntil(line.expiry, new Date(`${db.today}T12:00:00`)) <= 0) {
        return invalid(`lines.${index}.expiry`, 'past')
      }
    }
    const value = roundMoney(arriving.reduce((sum, line) => sum + line.received * line.cost, 0))
    if (input.payment.amount > value + 0.001) return invalid('payment.amount', 'tooMuch')

    for (const line of arriving) {
      const ordered = order.lines.find((item) => item.productId === line.productId)
      if (ordered) {
        ordered.received += line.received
        ordered.cost = line.cost
      }
      const product = db.products.find((item) => item.id === line.productId)
      if (!product) continue
      product.batches.push({
        code: line.batch.trim(),
        expiry: line.expiry,
        quantity: line.received,
        cost: line.cost,
        supplierId: order.supplierId,
      })
      product.movements.push({
        id: Math.max(0, ...product.movements.map((item) => item.id)) + 1,
        at: new Date().toISOString(),
        delta: line.received,
        kind: 'purchase',
        reference: order.number,
        actor: 'رزان',
      })
    }
    order.status = order.lines.every((line) => line.received >= line.quantity)
      ? 'received'
      : 'partial'
    addLedger({
      supplierId: order.supplierId,
      date: db.today,
      kind: 'invoice',
      reference: order.number,
      orderId: order.id,
      detail: [
        input.supplierInvoice && `فاتورة المورد ${input.supplierInvoice}`,
        `${arriving.length} أصناف`,
      ]
        .filter(Boolean)
        .join(' · '),
      method: null,
      fromDrawer: false,
      amount: value,
    })
    if (input.payment.amount > 0) {
      order.paid = roundMoney(order.paid + input.payment.amount)
      addLedger({
        supplierId: order.supplierId,
        date: db.today,
        kind: 'payment',
        reference: nextReceipt(),
        orderId: order.id,
        detail: [input.payment.fromDrawer ? 'من درج الوردية' : '', 'رزان']
          .filter(Boolean)
          .join(' · '),
        method: input.payment.method,
        fromDrawer: input.payment.fromDrawer,
        amount: input.payment.amount,
      })
    }
    return HttpResponse.json({
      data: {
        status: order.status,
        receivedValue: value,
        paid: input.payment.amount,
        addedToAccount: roundMoney(value - input.payment.amount),
      },
    })
  }),
]
