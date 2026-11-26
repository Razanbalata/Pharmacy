import { http, HttpResponse } from 'msw'
import type { Dashboard, DashboardEvent, TrendPoint } from '@/pages/dashboard'
import { daysUntil } from '@/shared/lib/date'
import { roundMoney } from '@/shared/lib/money'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { mockRole, users } from '../fixtures'
import { quantityOf } from './catalog'
import { customerView } from './customers'
import { shiftSummary } from './sales'

const DAY_MS = 86_400_000
const SOON_DAYS = 30

function me() {
  const role = mockRole()
  return role && role !== 'platform' ? users[role] : users.manager
}

function dayBefore(day: string, back = 1): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - back * DAY_MS).toISOString().slice(0, 10)
}

/** The fake data lives on a fixed day; what tests and clicks add now belongs to it too. */
function isToday(iso: string): boolean {
  const day = iso.slice(0, 10)
  return day === db.today || day === new Date().toISOString().slice(0, 10)
}

const first = (name: string) => name.split(' ')[0] ?? name

function nearest(productId: number) {
  return db.products
    .find((item) => item.id === productId)
    ?.batches.filter((batch) => batch.quantity > 0 && batch.expiry >= db.today)
    .sort((a, b) => a.expiry.localeCompare(b.expiry))[0]
}

function dashboard(): Dashboard {
  const user = me()
  const manager = user.role === 'manager'
  const now = new Date(`${db.today}T12:00:00`)
  const active = db.products.filter((product) => product.active)

  const expiredBatches = active.flatMap((product) =>
    product.batches
      .filter((batch) => batch.quantity > 0 && batch.expiry < db.today)
      .map((batch) => ({ product, batch })),
  )
  const expiringAll = active
    .map((product) => ({ product, batch: nearest(product.id) }))
    .filter(
      (item): item is { product: (typeof active)[number]; batch: NonNullable<typeof item.batch> } =>
        item.batch !== undefined &&
        daysUntil(item.batch.expiry, now) <= db.settings.stock.expiryAlertDays,
    )
    .sort((a, b) => a.batch.expiry.localeCompare(b.batch.expiry))
  const expiringMonth = expiringAll.filter(({ batch }) => daysUntil(batch.expiry, now) <= SOON_DAYS)
  const short = active
    .filter((product) => quantityOf(product) <= product.minStock)
    .sort((a, b) => quantityOf(a) / a.minStock - quantityOf(b) / b.minStock)
  const shortInStock = short.filter((product) => quantityOf(product) > 0)
  const urgent = shortInStock[0] ?? short[0]
  const draftOf = (productId: number) => {
    const order = db.orders.find(
      (item) => item.status === 'draft' && item.lines.some((line) => line.productId === productId),
    )
    return order ? { id: order.id, number: order.number } : null
  }
  const late = db.customers.map(customerView).filter((customer) => customer.debtAge === 'late')

  const today = db.invoices.filter((invoice) => isToday(invoice.at))
  const yesterday = db.invoices.filter((invoice) => invoice.at.slice(0, 10) === dayBefore(db.today))
  const sum = (list: typeof today) =>
    roundMoney(list.reduce((total, item) => total + item.total, 0))
  const salesToday = sum(today)
  const cost = today.reduce(
    (total, invoice) =>
      total + invoice.lines.reduce((lines, line) => lines + line.cost * line.quantity, 0),
    0,
  )
  const profit = roundMoney(salesToday - cost)

  const open = db.shifts.find((shift) => shift.status === 'open')

  // The month's best seller, by units sold in the same unit.
  const month = db.today.slice(0, 7)
  const sold = new Map<
    string,
    { productId: number; name: string; unit: string; quantity: number }
  >()
  for (const invoice of db.invoices.filter((item) => item.at.slice(0, 7) === month)) {
    for (const line of invoice.lines) {
      const key = `${line.productId}:${line.unit}`
      const entry = sold.get(key) ?? {
        productId: line.productId,
        name: line.name,
        unit: line.unit,
        quantity: 0,
      }
      entry.quantity += line.quantity - line.returned
      sold.set(key, entry)
    }
  }
  const top = [...sold.values()].sort((a, b) => b.quantity - a.quantity)[0]

  const notes: Dashboard['notes'] = []
  const soonest = expiringAll[0]
  if (soonest) {
    notes.push({
      kind: 'expiring',
      productId: soonest.product.id,
      name: soonest.product.name,
      expiry: soonest.batch.expiry,
      quantity: soonest.batch.quantity,
    })
  }
  if (urgent) {
    notes.push({
      kind: 'shortage',
      productId: urgent.id,
      name: urgent.name,
      quantity: quantityOf(urgent),
      minStock: urgent.minStock,
      draft: draftOf(urgent.id),
    })
  }
  if (top) notes.push({ kind: 'topSeller', ...top })

  // What happened today, newest first.
  const events: DashboardEvent[] = [
    ...today.map((invoice) => ({
      at: invoice.at,
      kind: 'sale' as const,
      actor: first(invoice.cashier),
      params: { amount: invoice.total, number: invoice.number },
    })),
    ...db.shifts
      .filter((shift) => isToday(shift.openedAt))
      .map((shift) => ({
        at: shift.openedAt,
        kind: 'shiftOpened' as const,
        actor: first(shift.cashierName),
        params: { number: shift.number, amount: shift.openingCash },
      })),
    ...db.damage
      .filter((record) => isToday(record.at))
      .map((record) => ({
        at: record.at,
        kind: 'damage' as const,
        actor: record.actor,
        params: { name: db.products.find((item) => item.id === record.productId)?.name ?? '' },
      })),
    ...db.counts
      .filter((count) => isToday(count.startedAt))
      .map((count) => ({
        at: count.startedAt,
        kind: 'countStarted' as const,
        actor: first(count.startedBy),
        params: {
          scope: db.categories.find((item) => item.id === count.categoryId)?.nameAr ?? '',
        },
      })),
    ...db.customerEntries
      .filter((entry) => entry.kind === 'payment' && isToday(entry.at))
      .map((entry) => ({
        at: entry.at,
        kind: 'customerPayment' as const,
        actor: entry.actor,
        params: {
          amount: entry.credit,
          name: db.customers.find((item) => item.id === entry.customerId)?.name ?? '',
        },
      })),
    ...db.returns
      .filter((item) => isToday(item.at))
      .map((item) => ({
        at: item.at,
        kind: 'return' as const,
        actor: first(user.name),
        params: { amount: item.amount, number: item.number },
      })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6)

  const openCount = db.counts.find((count) => count.status === 'open')
  const countLines = openCount?.lines.map((line) => {
    const batch = db.products
      .find((item) => item.id === line.productId)
      ?.batches.find((entry) => entry.code === line.batch)
    return { actual: line.actual, expected: batch?.quantity ?? 0 }
  })
  const arriving = db.orders.find((order) => order.status === 'sent')
  const mine = today.filter((invoice) => invoice.cashierId === user.id)

  return {
    attention: {
      expired: { batches: expiredBatches.length },
      expiring: {
        count: expiringMonth.length,
        nearest: expiringMonth[0]
          ? {
              productId: expiringMonth[0].product.id,
              name: expiringMonth[0].product.name,
              expiry: expiringMonth[0].batch.expiry,
            }
          : null,
      },
      low: {
        count: short.length,
        urgent: urgent
          ? {
              productId: urgent.id,
              name: urgent.name,
              quantity: quantityOf(urgent),
              minStock: urgent.minStock,
            }
          : null,
      },
      lateDebts: {
        count: late.length,
        amount: roundMoney(late.reduce((total, customer) => total + customer.debt, 0)),
      },
    },
    sales: {
      today: salesToday,
      invoices: today.length,
      yesterday: sum(yesterday),
      profit: manager ? profit : null,
      margin: manager && salesToday > 0 ? Math.round((profit / salesToday) * 100) : null,
    },
    drawer:
      manager && open
        ? { shiftNumber: open.number, expected: shiftSummary(open).expectedCash }
        : null,
    expiredProducts: new Set(expiredBatches.map(({ product }) => product.id)).size,
    notes,
    activity: events,
    tasks: {
      expired: expiredBatches.length
        ? {
            batches: expiredBatches.length,
            names: expiredBatches.map(({ product }) => product.name).join(' و '),
          }
        : null,
      count:
        openCount && countLines
          ? {
              id: openCount.id,
              scope: db.categories.find((item) => item.id === openCount.categoryId)?.nameAr ?? null,
              counted: countLines.filter((line) => line.actual !== null).length,
              total: countLines.length,
              differences: countLines.filter(
                (line) => line.actual !== null && line.actual !== line.expected,
              ).length,
            }
          : null,
      receive: arriving
        ? {
            orderId: arriving.id,
            number: arriving.number,
            supplier: db.suppliers.find((item) => item.id === arriving.supplierId)?.name ?? '',
            items: arriving.lines.length,
          }
        : null,
    },
    expiring: {
      total: expiringAll.length,
      items: expiringAll.slice(0, 3).map(({ product, batch }) => ({
        productId: product.id,
        name: product.name,
        expiry: batch.expiry,
        quantity: batch.quantity,
      })),
    },
    low: {
      total: short.length,
      items: short.slice(0, 3).map((product) => ({
        productId: product.id,
        name: product.name,
        quantity: quantityOf(product),
        minStock: product.minStock,
      })),
      draft: short[0] ? draftOf(short[0].id) : null,
    },
    mine: { total: sum(mine), invoices: mine.length },
    shift: open ? { number: open.number, cashier: open.cashierName } : null,
  }
}

/** Sales per day: the invoices kept, plus the totals saved with older shifts. */
function trend(days: number): TrendPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const date = dayBefore(db.today, days - 1 - index)
    const invoices = db.invoices
      .filter((invoice) => invoice.at.slice(0, 10) === date)
      .reduce((total, invoice) => total + invoice.total, 0)
    const archived = db.shifts
      .filter((shift) => shift.openedAt.slice(0, 10) === date)
      .reduce((total, shift) => total + (shift.archivedSales ?? 0), 0)
    return { date, total: roundMoney(invoices + archived) }
  })
}

export const dashboardHandlers = [
  http.get(apiUrl('/api/dashboard'), () => HttpResponse.json({ data: dashboard() })),
  http.get(apiUrl('/api/dashboard/sales'), ({ request }) => {
    const days = Number(new URL(request.url).searchParams.get('days') ?? 7)
    if (me().role !== 'manager') {
      return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
    }
    return HttpResponse.json({ data: trend([7, 30, 90].includes(days) ? days : 7) })
  }),
]
