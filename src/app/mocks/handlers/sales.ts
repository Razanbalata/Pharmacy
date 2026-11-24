import { http, HttpResponse } from 'msw'
import type { HoldInput, Invoice, InvoiceSummary, SaleInput } from '@/entities/invoice'
import type { ReturnInput } from '@/entities/sale-return'
import type { CloseShiftInput, Shift } from '@/entities/shift'
import { matchesSearch } from '@/shared/lib/arabic-search'
import { roundMoney } from '@/shared/lib/money'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { mockRole, users } from '../fixtures'
import type { StoredInvoice, StoredShift } from '../sales-data'

const DAY_MS = 86_400_000
const PER_PAGE = 25

function invalid(field: string, code: string) {
  return HttpResponse.json(
    { message: 'The given data was invalid.', errors: { [field]: [code] } },
    { status: 422 },
  )
}
const conflict = (message: string) => HttpResponse.json({ message }, { status: 409 })
const notFound = () => HttpResponse.json({ message: 'Not found.' }, { status: 404 })

function me() {
  const role = mockRole()
  const user = role && role !== 'platform' ? users[role] : users.manager
  return user
}

function openShift(): StoredShift | undefined {
  return db.shifts.find((shift) => shift.status === 'open')
}

function shiftView(shift: StoredShift): Shift {
  return {
    id: shift.id,
    number: shift.number,
    cashier: { id: shift.cashierId, name: shift.cashierName },
    openedAt: shift.openedAt,
    closedAt: shift.closedAt,
    openingCash: shift.openingCash,
    status: shift.status,
  }
}

function shiftSummary(shift: StoredShift) {
  const invoices = db.invoices.filter((invoice) => invoice.shiftNumber === shift.number)
  const sum = (pick: (invoice: StoredInvoice) => number) =>
    roundMoney(invoices.reduce((total, invoice) => total + pick(invoice), 0))
  const cashSales = sum((invoice) => invoice.payment.cash)
  const cashRefunds = roundMoney(
    db.returns
      .filter((item) => item.shiftNumber === shift.number && item.refund === 'cash')
      .reduce((total, item) => total + item.amount, 0),
  )
  const supplierPayments = roundMoney(
    db.ledger
      .filter(
        (entry) =>
          entry.kind === 'payment' &&
          entry.fromDrawer &&
          entry.date >= shift.openedAt.slice(0, 10) &&
          entry.date <= db.today,
      )
      .reduce((total, entry) => total + entry.amount, 0),
  )
  return {
    shift: shiftView(shift),
    invoiceCount: invoices.length,
    cashSales,
    bankSales: sum((invoice) => invoice.payment.bank),
    creditSales: sum((invoice) => invoice.payment.credit),
    cashRefunds,
    supplierPayments,
    expectedCash: roundMoney(shift.openingCash + cashSales - cashRefunds - supplierPayments),
    heldCount: db.held.length,
  }
}

/** How many of the first unit one unit of `unitIndex` is: a strip of a 2-strip box is 0.5. */
function factorOf(units: { perParent: number | null }[], unitIndex: number): number {
  let factor = 1
  for (let index = 1; index <= unitIndex; index += 1) factor *= units[index]?.perParent ?? 1
  return factor
}

function invoiceView(invoice: StoredInvoice): Invoice {
  const customer = db.customers.find((item) => item.id === invoice.customerId)
  const seesCost = mockRole() !== 'cashier'
  const cost = invoice.lines.reduce((sum, line) => sum + line.cost * line.quantity, 0)
  return {
    id: invoice.id,
    number: invoice.number,
    at: invoice.at,
    shiftNumber: invoice.shiftNumber,
    customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null,
    cashier: invoice.cashier,
    lines: invoice.lines.map(({ cost: _cost, ...line }) => line),
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    total: invoice.total,
    payment: invoice.payment,
    status: invoice.status,
    profit: seesCost ? roundMoney(invoice.total - cost) : null,
    log: invoice.log,
  }
}

function invoiceSummary(invoice: StoredInvoice): InvoiceSummary {
  const customer = db.customers.find((item) => item.id === invoice.customerId)
  return {
    id: invoice.id,
    number: invoice.number,
    at: invoice.at,
    customer: customer?.name ?? null,
    cashier: invoice.cashier,
    lineCount: invoice.lines.length,
    method: invoice.payment.method,
    total: invoice.total,
    status: invoice.status,
  }
}

function inPeriod(iso: string, period: string): boolean {
  const day = iso.slice(0, 10)
  const today = Date.parse(`${db.today}T00:00:00Z`)
  const yesterday = new Date(today - DAY_MS).toISOString().slice(0, 10)
  if (period === 'today') return day === db.today
  if (period === 'yesterday') return day === yesterday
  if (period === 'week') return Date.parse(iso) >= today - 6 * DAY_MS
  return day.slice(0, 7) === db.today.slice(0, 7)
}

export const salesHandlers = [
  http.get(apiUrl('/api/customers/options'), ({ request }) => {
    const search = new URL(request.url).searchParams.get('search') ?? ''
    return HttpResponse.json({
      data: db.customers.filter(
        (customer) => !search || matchesSearch(`${customer.name} ${customer.phone}`, search),
      ),
    })
  }),

  http.get(apiUrl('/api/shifts/current'), () => {
    const shift = openShift()
    const last = db.shifts
      .filter((item) => item.status === 'closed')
      .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))[0]
    return HttpResponse.json({
      data: { shift: shift ? shiftView(shift) : null, lastClosingCash: last?.countedCash ?? null },
    })
  }),

  http.post(apiUrl('/api/shifts'), async ({ request }) => {
    if (openShift()) return conflict('A shift is open.')
    const { openingCash } = (await request.json()) as { openingCash: number }
    if (!(openingCash >= 0)) return invalid('openingCash', 'invalid')
    const user = me()
    const number = Math.max(0, ...db.shifts.map((item) => item.number)) + 1
    const shift: StoredShift = {
      id: number,
      number,
      cashierId: user.id,
      cashierName: user.name,
      openedAt: new Date().toISOString(),
      closedAt: null,
      openingCash,
      expectedCash: null,
      countedCash: null,
      note: '',
      status: 'open',
    }
    db.shifts.push(shift)
    return HttpResponse.json({ data: shiftView(shift) }, { status: 201 })
  }),

  http.get(apiUrl('/api/shifts/current/summary'), () => {
    const shift = openShift()
    return shift ? HttpResponse.json({ data: shiftSummary(shift) }) : notFound()
  }),

  http.post(apiUrl('/api/shifts/current/close'), async ({ request }) => {
    const shift = openShift()
    if (!shift) return notFound()
    if (db.held.length > 0) return conflict('Held invoices.')
    const input = (await request.json()) as CloseShiftInput
    const { expectedCash } = shiftSummary(shift)
    const difference = roundMoney(input.countedCash - expectedCash)
    if (difference !== 0 && !input.note.trim()) return invalid('note', 'required')
    Object.assign(shift, {
      status: 'closed',
      closedAt: new Date().toISOString(),
      expectedCash,
      countedCash: input.countedCash,
      note: input.note.trim(),
    })
    return HttpResponse.json({
      data: { shift: shiftView(shift), expectedCash, countedCash: input.countedCash, difference },
    })
  }),

  http.get(apiUrl('/api/sales/held'), () => HttpResponse.json({ data: db.held })),

  http.post(apiUrl('/api/sales/held'), async ({ request }) => {
    const input = (await request.json()) as HoldInput
    const customer = db.customers.find((item) => item.id === input.customerId)
    const held = {
      id: Math.max(1, ...db.held.map((item) => item.id)) + 1,
      label: input.label,
      at: new Date().toISOString(),
      cashier: me().name,
      customer: customer ? { id: customer.id, name: customer.name } : null,
      discount: input.discount,
      lines: input.lines,
      total: input.total,
    }
    db.held.push(held)
    return HttpResponse.json({ data: held }, { status: 201 })
  }),

  http.delete(apiUrl('/api/sales/held/:id'), ({ params }) => {
    db.held = db.held.filter((item) => item.id !== Number(params.id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiUrl('/api/sales'), async ({ request }) => {
    const shift = openShift()
    if (!shift) return conflict('No open shift.')
    const input = (await request.json()) as SaleInput
    if (input.lines.length === 0) return invalid('lines', 'required')
    const user = me()

    // Check everything first, so a refused sale changes nothing.
    const plan = []
    for (const [index, line] of input.lines.entries()) {
      const product = db.products.find((item) => item.id === line.productId)
      const unit = product?.units[line.unitIndex]
      if (!product || !product.active || !unit?.enabled || !(line.quantity > 0)) {
        return invalid(`lines.${index}.productId`, 'invalid')
      }
      const base = line.quantity / factorOf(product.units, line.unitIndex)
      const sellable = product.batches
        .filter((batch) => batch.quantity > 0 && batch.expiry >= db.today)
        .sort((a, b) => a.expiry.localeCompare(b.expiry))
      const available = sellable.reduce((sum, batch) => sum + batch.quantity, 0)
      if (base > available + 1e-9) return invalid(`lines.${index}.quantity`, 'stock')
      plan.push({ product, unit, line, base, sellable })
    }
    const subtotal = roundMoney(
      plan.reduce((sum, item) => sum + item.unit.price * item.line.quantity, 0),
    )
    const discount = roundMoney(Math.max(0, input.discount))
    if (discount > subtotal) return invalid('discount', 'tooMuch')
    if (user.discountLimit !== null && discount > (subtotal * user.discountLimit) / 100 + 1e-9) {
      return invalid('discount', 'overLimit')
    }
    const total = roundMoney(subtotal - discount)
    const { method, cash, bank, credit, received } = input.payment
    if (roundMoney(cash + bank + credit) !== total) return invalid('payment', 'mismatch')
    if (method === 'cash' && received < cash) return invalid('payment.received', 'short')
    const customer = db.customers.find((item) => item.id === input.customerId)
    if (credit > 0) {
      if (!customer) return invalid('customerId', 'required')
      if (customer.debt + credit > customer.debtLimit) {
        if (!input.overLimitApproved) return invalid('payment.credit', 'overLimit')
        if (user.role !== 'manager')
          return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
      }
    }

    const id = Math.max(0, ...db.invoices.map((item) => item.id)) + 1
    const number = `INV-${String(id).padStart(6, '0')}`
    const at = new Date().toISOString()
    const lines: StoredInvoice['lines'] = []
    for (const { product, unit, line, base, sellable } of plan) {
      let left = base
      const first = sellable[0]
      for (const batch of sellable) {
        if (left <= 1e-9) break
        const take = Math.min(batch.quantity, left)
        batch.quantity = roundMoney(batch.quantity - take)
        left -= take
        product.movements.push({
          id: Math.max(0, ...product.movements.map((item) => item.id)) + 1,
          at,
          delta: -roundMoney(take),
          kind: 'sale',
          reference: number,
          actor: user.name.split(' ')[0] ?? user.name,
          batch: batch.code,
          balanceAfter: batch.quantity,
        })
      }
      lines.push({
        productId: product.id,
        name: product.name,
        batch: first?.code ?? '',
        unit: unit.name,
        quantity: line.quantity,
        price: unit.price,
        total: roundMoney(unit.price * line.quantity),
        returned: 0,
        cost: (first?.cost ?? 0) / factorOf(product.units, line.unitIndex),
      })
    }
    if (customer && credit > 0) customer.debt = roundMoney(customer.debt + credit)
    const invoice: StoredInvoice = {
      id,
      number,
      at,
      shiftNumber: shift.number,
      customerId: customer?.id ?? null,
      cashierId: user.id,
      cashier: user.name,
      lines,
      subtotal,
      discount,
      total,
      payment: {
        method,
        cash,
        bank,
        credit,
        received,
        change: roundMoney(Math.max(0, received - cash)),
      },
      status: 'completed',
      log: [{ at, text: `أنشأها ${user.name}` }],
    }
    db.invoices.push(invoice)
    return HttpResponse.json({ data: invoiceView(invoice) }, { status: 201 })
  }),

  http.get(apiUrl('/api/invoices'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const period = query.get('period') ?? 'today'
    const cashier = query.get('cashier')
    const method = query.get('method')
    const status = query.get('status')
    const search = query.get('search') ?? ''
    const page = Number(query.get('page') ?? 1)
    const list = db.invoices
      .filter(
        (invoice) =>
          inPeriod(invoice.at, period) &&
          (!cashier || invoice.cashierId === Number(cashier)) &&
          (!method || invoice.payment.method === method) &&
          (!status || invoice.status === status),
      )
      .map(invoiceSummary)
      .filter(
        (invoice) =>
          !search || matchesSearch(`${invoice.number} ${invoice.customer ?? ''}`, search),
      )
      .sort((a, b) => b.at.localeCompare(a.at))
    const full = list.map((item) => db.invoices.find((invoice) => invoice.id === item.id))
    const sum = (pick: (invoice: StoredInvoice) => number) =>
      roundMoney(full.reduce((total, invoice) => total + (invoice ? pick(invoice) : 0), 0))
    return HttpResponse.json({
      data: list.slice((page - 1) * PER_PAGE, page * PER_PAGE),
      meta: { total: list.length, page, perPage: PER_PAGE },
      totals: {
        count: list.length,
        total: sum((invoice) => invoice.total),
        cash: sum((invoice) => invoice.payment.cash),
        bank: sum((invoice) => invoice.payment.bank),
        credit: sum((invoice) => invoice.payment.credit),
      },
    })
  }),

  http.get(apiUrl('/api/invoices/:id'), ({ params }) => {
    const invoice = db.invoices.find((item) => item.id === Number(params.id))
    return invoice ? HttpResponse.json({ data: invoiceView(invoice) }) : notFound()
  }),

  http.post(apiUrl('/api/returns'), async ({ request }) => {
    const input = (await request.json()) as ReturnInput
    const invoice = db.invoices.find((item) => item.id === input.invoiceId)
    if (!invoice) return notFound()
    const ageDays = (Date.parse(`${db.today}T23:59:59Z`) - Date.parse(invoice.at)) / DAY_MS
    if (ageDays > db.settings.sale.returnDays) return invalid('invoiceId', 'tooOld')
    const approver = db.staff.find((member) => member.id === input.approverId)
    if (!approver?.active || approver.role === 'cashier') return invalid('approverId', 'invalid')
    const lines = input.lines.filter((line) => line.quantity > 0)
    if (lines.length === 0) return invalid('lines', 'required')
    for (const [index, line] of lines.entries()) {
      const sold = invoice.lines.find((item) => item.productId === line.productId)
      if (!sold || line.quantity > sold.quantity - sold.returned) {
        return invalid(`lines.${index}.quantity`, 'tooMuch')
      }
    }
    const customer = db.customers.find((item) => item.id === invoice.customerId)
    if (input.refund === 'debt' && !customer) return invalid('refund', 'noCustomer')

    const share = invoice.subtotal > 0 ? invoice.total / invoice.subtotal : 1
    let amount = 0
    const at = new Date().toISOString()
    const id = db.returns.length + 13
    const number = `RT-${String(id).padStart(4, '0')}`
    for (const line of lines) {
      const sold = invoice.lines.find((item) => item.productId === line.productId)!
      sold.returned += line.quantity
      amount += sold.price * line.quantity * share
      const product = db.products.find((item) => item.id === line.productId)
      if (!product) continue
      const factor =
        sold.price > 0
          ? factorOf(
              product.units,
              product.units.findIndex((unit) => unit.name === sold.unit),
            )
          : 1
      const base = roundMoney(line.quantity / factor)
      let batch = product.batches.find((item) => item.code === sold.batch)
      if (!batch) {
        batch = {
          code: sold.batch,
          expiry: db.today,
          quantity: 0,
          cost: sold.cost * factor,
          supplierId: null,
        }
        product.batches.push(batch)
      }
      const movement = (delta: number, kind: 'return' | 'damage') =>
        product.movements.push({
          id: Math.max(0, ...product.movements.map((item) => item.id)) + 1,
          at,
          delta,
          kind,
          reference: number,
          actor: me().name.split(' ')[0] ?? '',
          batch: batch.code,
          balanceAfter: batch.quantity,
        })
      batch.quantity = roundMoney(batch.quantity + base)
      movement(base, 'return')
      if (line.destination === 'damage') {
        batch.quantity = roundMoney(batch.quantity - base)
        movement(-base, 'damage')
        db.damage.unshift({
          id: Math.max(0, ...db.damage.map((item) => item.id)) + 1,
          at,
          productId: product.id,
          batch: batch.code,
          quantity: base,
          reason: 'customerReturn',
          note: number,
          loss: roundMoney(base * batch.cost),
          actor: me().name.split(' ')[0] ?? '',
        })
      }
    }
    amount = roundMoney(amount)
    if (input.refund === 'debt' && customer)
      customer.debt = roundMoney(Math.max(0, customer.debt - amount))
    invoice.status = invoice.lines.every((line) => line.returned >= line.quantity)
      ? 'returned'
      : 'partlyReturned'
    invoice.log.push({
      at,
      text: `مرتجع ${number} بـ ${amount.toFixed(2)} ₪ · وافق ${approver.name}`,
    })
    db.returns.push({
      id,
      number,
      invoiceId: invoice.id,
      at,
      shiftNumber: openShift()?.number ?? invoice.shiftNumber,
      amount,
      refund: input.refund,
    })
    return HttpResponse.json(
      { data: { id, number, invoiceNumber: invoice.number, amount, refund: input.refund } },
      { status: 201 },
    )
  }),
]
