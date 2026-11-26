import { http, HttpResponse } from 'msw'
import type {
  DebtsReport,
  ProfitReport,
  ReportPeriod,
  SalesReport,
  StockReport,
} from '@/pages/reports'
import { roundMoney } from '@/shared/lib/money'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { mockRole, users } from '../fixtures'
import { quantityOf } from './catalog'
import { customerView } from './customers'
import { balanceOf } from './purchases'

const DAY_MS = 86_400_000

function me() {
  const role = mockRole()
  return role && role !== 'platform' ? users[role] : users.manager
}

const day = (time: number) => new Date(time).toISOString().slice(0, 10)
const at = (date: string) => Date.parse(`${date}T00:00:00Z`)

/** The period's first and last day, and the same stretch before it. */
function rangeOf(period: ReportPeriod) {
  const today = db.today
  const [year, month, date] = today.split('-').map(Number) as [number, number, number]
  const monthStart = (y: number, m: number) => day(Date.UTC(y, m - 1, 1))
  switch (period) {
    case 'today':
      return {
        period,
        from: today,
        to: today,
        compareFrom: day(at(today) - DAY_MS),
        compareTo: day(at(today) - DAY_MS),
      }
    case 'week':
      return {
        period,
        from: day(at(today) - 6 * DAY_MS),
        to: today,
        compareFrom: day(at(today) - 13 * DAY_MS),
        compareTo: day(at(today) - 7 * DAY_MS),
      }
    case 'lastMonth':
      return {
        period,
        from: monthStart(year, month - 1),
        to: day(Date.UTC(year, month - 1, 0)),
        compareFrom: monthStart(year, month - 2),
        compareTo: day(Date.UTC(year, month - 2, 0)),
      }
    case 'year':
      return {
        period,
        from: `${year}-01-01`,
        to: today,
        compareFrom: `${year - 1}-01-01`,
        compareTo: `${year - 1}-${today.slice(5)}`,
      }
    default:
      // This month so far, against the same days of last month.
      return {
        period: 'month' as const,
        from: monthStart(year, month),
        to: today,
        compareFrom: monthStart(year, month - 1),
        compareTo: day(Date.UTC(year, month - 2, Math.min(date, 28))),
      }
  }
}

const within = (iso: string, from: string, to: string) => {
  const date = iso.slice(0, 10)
  return date >= from && date <= to
}

/** Every sale in a stretch: invoices kept line by line, and older shifts kept as totals. */
function salesIn(from: string, to: string) {
  const invoices = db.invoices.filter((invoice) => within(invoice.at, from, to))
  const shifts = db.shifts.filter((shift) => shift.archived && within(shift.openedAt, from, to))
  const total = roundMoney(
    invoices.reduce((sum, invoice) => sum + invoice.total, 0) +
      shifts.reduce((sum, shift) => sum + (shift.archivedSales ?? 0), 0),
  )
  const count =
    invoices.length + shifts.reduce((sum, shift) => sum + (shift.archived?.invoices ?? 0), 0)
  const cost = roundMoney(
    invoices.reduce(
      (sum, invoice) =>
        sum + invoice.lines.reduce((lines, line) => lines + line.cost * line.quantity, 0),
      0,
    ) + shifts.reduce((sum, shift) => sum + (shift.archived?.cost ?? 0), 0),
  )
  return { invoices, shifts, total, count, cost }
}

function sales(period: ReportPeriod): SalesReport {
  const range = rangeOf(period)
  const now = salesIn(range.from, range.to)
  const before = salesIn(range.compareFrom, range.compareTo)
  const byMonth = period === 'year'
  const points: { date: string; total: number }[] = []
  if (byMonth) {
    for (let month = 1; month <= Number(range.to.slice(5, 7)); month += 1) {
      const key = `${range.to.slice(0, 4)}-${String(month).padStart(2, '0')}`
      const last = day(Date.UTC(Number(key.slice(0, 4)), month, 0))
      points.push({ date: key, total: salesIn(`${key}-01`, last).total })
    }
  } else {
    for (let time = at(range.from); time <= at(range.to); time += DAY_MS) {
      points.push({ date: day(time), total: salesIn(day(time), day(time)).total })
    }
  }
  const staff = new Map<number, { id: number; name: string; total: number; invoices: number }>()
  const credit = (id: number, name: string, total: number, invoices: number) => {
    const entry = staff.get(id) ?? { id, name, total: 0, invoices: 0 }
    entry.total = roundMoney(entry.total + total)
    entry.invoices += invoices
    staff.set(id, entry)
  }
  for (const invoice of now.invoices) credit(invoice.cashierId, invoice.cashier, invoice.total, 1)
  for (const shift of now.shifts) {
    credit(
      shift.cashierId,
      shift.cashierName,
      shift.archivedSales ?? 0,
      shift.archived?.invoices ?? 0,
    )
  }
  const top = new Map<string, SalesReport['top'][number]>()
  for (const invoice of now.invoices) {
    for (const line of invoice.lines) {
      const key = `${line.productId}:${line.unit}`
      const entry = top.get(key) ?? {
        productId: line.productId,
        name: line.name,
        quantity: 0,
        unit: line.unit,
        total: 0,
      }
      entry.quantity += line.quantity
      entry.total = roundMoney(entry.total + line.total)
      top.set(key, entry)
    }
  }
  const method = (pick: 'cash' | 'bank' | 'credit') =>
    roundMoney(
      now.invoices.reduce((sum, invoice) => sum + invoice.payment[pick], 0) +
        now.shifts.reduce((sum, shift) => sum + (shift.archived?.[pick] ?? 0), 0),
    )
  return {
    ...range,
    sales: now.total,
    invoices: now.count,
    average: now.count ? roundMoney(now.total / now.count) : 0,
    returns: roundMoney(
      db.returns
        .filter((item) => within(item.at, range.from, range.to))
        .reduce((sum, item) => sum + item.amount, 0),
    ),
    previous: {
      sales: before.total,
      invoices: before.count,
      average: before.count ? roundMoney(before.total / before.count) : 0,
    },
    series: { unit: byMonth ? 'month' : 'day', points },
    byMethod: { cash: method('cash'), bank: method('bank'), credit: method('credit') },
    byStaff: [...staff.values()].sort((a, b) => b.total - a.total),
    top: [...top.values()].sort((a, b) => b.total - a.total).slice(0, 5),
  }
}

function profit(period: ReportPeriod): ProfitReport {
  const range = rangeOf(period)
  const figures = (from: string, to: string) => {
    const found = salesIn(from, to)
    const expenses = roundMoney(
      db.expenses
        .filter((item) => within(item.date, from, to))
        .reduce((sum, item) => sum + item.amount, 0),
    )
    const damage = roundMoney(
      db.damage
        .filter((item) => within(item.at, from, to))
        .reduce((sum, item) => sum + item.loss, 0),
    )
    const gross = roundMoney(found.total - found.cost)
    return { found, expenses, damage, gross, net: roundMoney(gross - expenses - damage) }
  }
  const now = figures(range.from, range.to)
  const before = figures(range.compareFrom, range.compareTo)
  const percent = (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0

  const categories = new Map<number | null, ProfitReport['byCategory'][number]>()
  for (const invoice of now.found.invoices) {
    for (const line of invoice.lines) {
      const product = db.products.find((item) => item.id === line.productId)
      const category = db.categories.find((item) => item.id === product?.categoryId)
      const id = category?.id ?? null
      const entry = categories.get(id) ?? { id, name: category?.nameAr ?? '', sales: 0, profit: 0 }
      entry.sales = roundMoney(entry.sales + line.total)
      entry.profit = roundMoney(entry.profit + line.total - line.cost * line.quantity)
      categories.set(id, entry)
    }
  }
  const archived = now.found.shifts.reduce(
    (sum, shift) => ({
      sales: sum.sales + (shift.archivedSales ?? 0),
      profit: sum.profit + (shift.archivedSales ?? 0) - (shift.archived?.cost ?? 0),
    }),
    { sales: 0, profit: 0 },
  )
  const byCategory = [...categories.values()].sort((a, b) => b.profit - a.profit)
  // Older shifts were kept as totals, so their sales have no category.
  if (archived.sales > 0) {
    byCategory.push({
      id: null,
      name: '',
      sales: roundMoney(archived.sales),
      profit: roundMoney(archived.profit),
      archived: true,
    })
  }

  const lowMargin = db.products
    .filter((product) => product.active)
    .flatMap((product) => {
      const price = product.units[0]?.price ?? 0
      const cost = [...product.batches].sort((a, b) => b.expiry.localeCompare(a.expiry))[0]?.cost
      if (!price || cost === undefined) return []
      const margin = Math.round(((price - cost) / price) * 100)
      return margin < 22 ? [{ productId: product.id, name: product.name, margin }] : []
    })
    .sort((a, b) => a.margin - b.margin)

  return {
    ...range,
    sales: now.found.total,
    cost: now.found.cost,
    gross: now.gross,
    expenses: now.expenses,
    damage: now.damage,
    net: now.net,
    grossMargin: percent(now.gross, now.found.total),
    netMargin: percent(now.net, now.found.total),
    previousNetMargin: before.found.total > 0 ? percent(before.net, before.found.total) : null,
    byCategory,
    lowMargin,
  }
}

function stock(): StockReport {
  const today = db.today
  const in30 = day(at(today) + 30 * DAY_MS)
  const in90 = day(at(today) + 90 * DAY_MS)
  const since60 = day(at(today) - 60 * DAY_MS)
  const batches = db.products
    .filter((product) => product.active)
    .flatMap((product) =>
      product.batches
        .filter((batch) => batch.quantity > 0)
        .map((batch) => ({ product, batch, value: batch.quantity * batch.cost })),
    )
  const sum = (list: typeof batches) =>
    roundMoney(list.reduce((total, item) => total + item.value, 0))
  const products = (list: typeof batches) => new Set(list.map((item) => item.product.id)).size
  const expired = batches.filter(({ batch }) => batch.expiry < today)
  const soon = batches.filter(({ batch }) => batch.expiry >= today && batch.expiry <= in30)
  const later = batches.filter(({ batch }) => batch.expiry > in30 && batch.expiry <= in90)
  const stagnant = db.products.filter(
    (product) =>
      product.active &&
      quantityOf(product) > 0 &&
      !product.movements.some(
        (movement) => movement.kind === 'sale' && movement.at.slice(0, 10) >= since60,
      ),
  )
  const byCategory = new Map<string, number>()
  for (const { product, value } of batches) {
    const name = db.categories.find((item) => item.id === product.categoryId)?.nameAr ?? ''
    byCategory.set(name, roundMoney((byCategory.get(name) ?? 0) + value))
  }
  return {
    valueAtCost: sum(batches),
    valueAtPrice: roundMoney(
      batches.reduce(
        (total, { product, batch }) => total + batch.quantity * (product.units[0]?.price ?? 0),
        0,
      ),
    ),
    damageThisMonth: roundMoney(
      db.damage
        .filter((item) => item.at.slice(0, 7) === today.slice(0, 7))
        .reduce((total, item) => total + item.loss, 0),
    ),
    stagnant: {
      count: stagnant.length,
      value: sum(batches.filter((item) => stagnant.includes(item.product))),
    },
    expired: { batches: expired.length, value: sum(expired) },
    within30: { count: products(soon), value: sum(soon) },
    within90: { count: products(later), value: sum(later) },
    nearest: [...soon, ...later]
      .sort((a, b) => a.batch.expiry.localeCompare(b.batch.expiry))
      .slice(0, 5)
      .map(({ product, batch, value }) => ({
        productId: product.id,
        name: product.name,
        batch: batch.code,
        expiry: batch.expiry,
        quantity: batch.quantity,
        unit: product.units[0]?.name ?? '',
        value: roundMoney(value),
      })),
    byCategory: [...byCategory.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  }
}

function debts(): DebtsReport {
  const customers = db.customers.map(customerView).filter((customer) => customer.debt > 0)
  const by = (age: string) =>
    roundMoney(
      customers
        .filter((customer) => customer.debtAge === age)
        .reduce((sum, item) => sum + item.debt, 0),
    )
  const suppliers = db.suppliers
    .map((supplier) => ({
      supplierId: supplier.id,
      name: supplier.name,
      balance: balanceOf(supplier.id),
    }))
    .filter((supplier) => supplier.balance > 0)
    .sort((a, b) => b.balance - a.balance)
  return {
    customers: {
      total: roundMoney(customers.reduce((sum, item) => sum + item.debt, 0)),
      recent: by('recent'),
      weeks: by('weeks'),
      late: by('late'),
    },
    top: customers
      .sort(
        (a, b) => Number(b.debtAge === 'late') - Number(a.debtAge === 'late') || b.debt - a.debt,
      )
      .slice(0, 4)
      .map((customer) => ({
        customerId: customer.id,
        name: customer.name,
        debt: customer.debt,
        days: customer.debtDays,
        late: customer.debtAge === 'late',
      })),
    reminders: customers
      .filter((customer) => customer.debtAge === 'late' && customer.phone)
      .map((customer) => ({
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        debt: customer.debt,
      })),
    collectedThisMonth: roundMoney(
      db.customerEntries
        .filter(
          (entry) => entry.kind === 'payment' && entry.at.slice(0, 7) === db.today.slice(0, 7),
        )
        .reduce((sum, entry) => sum + entry.credit, 0),
    ),
    suppliers: {
      total: roundMoney(suppliers.reduce((sum, item) => sum + item.balance, 0)),
      list: suppliers,
    },
  }
}

const periodOf = (request: Request) =>
  (new URL(request.url).searchParams.get('period') ?? 'month') as ReportPeriod
const forbidden = () => HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })

export const reportHandlers = [
  http.get(apiUrl('/api/reports/sales'), ({ request }) =>
    HttpResponse.json({ data: sales(periodOf(request)) }),
  ),
  // Profit shows what everything cost: the manager's only.
  http.get(apiUrl('/api/reports/profit'), ({ request }) =>
    me().role === 'manager' ? HttpResponse.json({ data: profit(periodOf(request)) }) : forbidden(),
  ),
  http.get(apiUrl('/api/reports/stock'), () => HttpResponse.json({ data: stock() })),
  http.get(apiUrl('/api/reports/debts'), () => HttpResponse.json({ data: debts() })),
]
