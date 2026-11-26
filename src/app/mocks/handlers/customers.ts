import { http, HttpResponse } from 'msw'
import type {
  Customer,
  CustomerFilter,
  CustomerInput,
  CustomerOption,
  CustomerPaymentInput,
  CustomerStatementLine,
  CustomerStatementPeriod,
  DebtAge,
} from '@/entities/customer'
import { matchesSearch } from '@/shared/lib/arabic-search'
import { roundMoney } from '@/shared/lib/money'
import { isPhoneNumber, normalizePhone } from '@/shared/lib/validation'
import { apiUrl } from '../api-url'
import type { StoredCustomer, StoredCustomerEntry } from '../customers-data'
import { db } from '../db'
import { mockRole, users } from '../fixtures'

const DAY_MS = 86_400_000

function invalid(field: string, code: string) {
  return HttpResponse.json(
    { message: 'The given data was invalid.', errors: { [field]: [code] } },
    { status: 422 },
  )
}
const notFound = () => HttpResponse.json({ message: 'Not found.' }, { status: 404 })

function me() {
  const role = mockRole()
  return role && role !== 'platform' ? users[role] : users.manager
}

function entriesOf(customerId: number): StoredCustomerEntry[] {
  return db.customerEntries
    .filter((entry) => entry.customerId === customerId)
    .sort((a, b) => a.at.localeCompare(b.at))
}

/** What the customer owes: the sum of the account, never a number kept on its own. */
export function debtOf(customerId: number): number {
  return roundMoney(
    entriesOf(customerId).reduce((sum, entry) => sum + entry.debit - entry.credit, 0),
  )
}

/** Adds a line to the account. The sale and return handlers call this too. */
export function addCustomerEntry(entry: Omit<StoredCustomerEntry, 'id'>): StoredCustomerEntry {
  const stored = { id: Math.max(0, ...db.customerEntries.map((item) => item.id)) + 1, ...entry }
  db.customerEntries.push(stored)
  return stored
}

export function customerOption(customer: StoredCustomer): CustomerOption {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    debt: debtOf(customer.id),
    debtLimit: customer.debtLimit,
    creditAllowed: customer.creditAllowed,
  }
}

/** Payments pay off the oldest debt first; what is left of the oldest one dates the debt. */
function oldestDebt(customerId: number): string | null {
  const entries = entriesOf(customerId)
  let paid = entries.reduce((sum, entry) => sum + entry.credit, 0)
  for (const entry of entries) {
    if (entry.debit <= 0) continue
    if (paid + 1e-9 >= entry.debit) paid -= entry.debit
    else return entry.at
  }
  return null
}

function ageOf(days: number, debt: number): DebtAge {
  if (debt <= 0) return 'none'
  if (days > 30) return 'late'
  if (days >= 14) return 'weeks'
  return 'recent'
}

export function customerView(customer: StoredCustomer): Customer {
  const option = customerOption(customer)
  const oldest = option.debt > 0 ? oldestDebt(customer.id) : null
  const today = Date.parse(`${db.today}T23:59:59Z`)
  const debtDays = oldest ? Math.floor((today - Date.parse(oldest)) / DAY_MS) : 0
  const purchases = [
    ...entriesOf(customer.id)
      .filter((entry) => entry.kind === 'sale')
      .map((entry) => entry.at),
    ...db.invoices
      .filter((invoice) => invoice.customerId === customer.id)
      .map((invoice) => invoice.at),
  ].sort()
  return {
    ...option,
    notes: customer.notes,
    since: customer.since,
    lastPurchase: purchases.at(-1) ?? null,
    oldestDebt: oldest,
    debtDays,
    debtAge: ageOf(debtDays, option.debt),
  }
}

function matchesFilter(customer: Customer, filter: CustomerFilter): boolean {
  if (filter === 'withDebt') return customer.debt > 0
  if (filter === 'overLimit') return customer.debt > customer.debtLimit
  if (filter === 'late') return customer.debtAge === 'late'
  return true
}

function periodStart(period: CustomerStatementPeriod): string {
  const [year, month] = db.today.split('-').map(Number) as [number, number]
  if (period === 'year') return `${year}-01-01`
  if (period === 'quarter') {
    const start = new Date(Date.UTC(year, month - 3, 1))
    return start.toISOString().slice(0, 10)
  }
  return `${db.today.slice(0, 7)}-01`
}

function checkInput(input: Partial<CustomerInput>, ownId: number | null) {
  if (!input.name?.trim()) return invalid('name', 'required')
  const phone = input.phone?.trim() ? normalizePhone(input.phone) : ''
  if (phone && !isPhoneNumber(phone)) return invalid('phone', 'invalid')
  if (input.creditAllowed && !phone) return invalid('phone', 'requiredForCredit')
  if (phone && db.customers.some((item) => item.phone === phone && item.id !== ownId)) {
    return invalid('phone', 'taken')
  }
  if (!(Number(input.debtLimit ?? 0) >= 0)) return invalid('debtLimit', 'invalid')
  return null
}

export const customerHandlers = [
  http.get(apiUrl('/api/customers/options'), ({ request }) => {
    const search = new URL(request.url).searchParams.get('search') ?? ''
    return HttpResponse.json({
      data: db.customers
        .filter(
          (customer) => !search || matchesSearch(`${customer.name} ${customer.phone}`, search),
        )
        .map(customerOption),
    })
  }),

  http.get(apiUrl('/api/customers'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const filter = (query.get('filter') ?? 'all') as CustomerFilter
    const search = query.get('search') ?? ''
    const all = db.customers.map(customerView)
    const month = db.today.slice(0, 7)
    const late = all.filter((customer) => customer.debtAge === 'late')
    const counts = {
      all: all.length,
      withDebt: all.filter((customer) => matchesFilter(customer, 'withDebt')).length,
      overLimit: all.filter((customer) => matchesFilter(customer, 'overLimit')).length,
      late: late.length,
    }
    const list = all
      .filter(
        (customer) =>
          matchesFilter(customer, filter) &&
          (!search || matchesSearch(`${customer.name} ${customer.phone}`, search)),
      )
      // Who owes the longest comes first; then who owes most; then by name.
      .sort(
        (a, b) => b.debtDays - a.debtDays || b.debt - a.debt || a.name.localeCompare(b.name, 'ar'),
      )
    return HttpResponse.json({
      data: list,
      summary: {
        totalDebt: roundMoney(all.reduce((sum, customer) => sum + customer.debt, 0)),
        withDebt: counts.withDebt,
        late: {
          count: late.length,
          amount: roundMoney(late.reduce((sum, customer) => sum + customer.debt, 0)),
        },
        collectedThisMonth: roundMoney(
          db.customerEntries
            .filter((entry) => entry.kind === 'payment' && entry.at.slice(0, 7) === month)
            .reduce((sum, entry) => sum + entry.credit, 0),
        ),
        counts,
      },
    })
  }),

  http.post(apiUrl('/api/customers'), async ({ request }) => {
    const input = (await request.json()) as CustomerInput
    const failed = checkInput(input, null)
    if (failed) return failed
    if (!(input.openingDebt >= 0)) return invalid('openingDebt', 'invalid')
    const user = me()
    // A cashier adds the name and phone at the till; the limit stays the pharmacy default.
    const limited = user.role === 'cashier'
    const customer: StoredCustomer = {
      id: Math.max(0, ...db.customers.map((item) => item.id)) + 1,
      name: input.name.trim(),
      phone: input.phone ? normalizePhone(input.phone) : '',
      creditAllowed: input.creditAllowed,
      debtLimit: limited ? db.settings.sale.defaultDebtLimit : input.debtLimit,
      notes: input.notes.trim(),
      since: db.today,
    }
    db.customers.push(customer)
    if (input.openingDebt > 0 && !limited) {
      addCustomerEntry({
        customerId: customer.id,
        at: new Date().toISOString(),
        kind: 'opening',
        reference: '',
        invoiceId: null,
        method: null,
        actor: user.name.split(' ')[0] ?? user.name,
        items: null,
        debit: roundMoney(input.openingDebt),
        credit: 0,
        shiftNumber: null,
      })
    }
    return HttpResponse.json({ data: customerView(customer) }, { status: 201 })
  }),

  http.put(apiUrl('/api/customers/:id'), async ({ params, request }) => {
    const customer = db.customers.find((item) => item.id === Number(params.id))
    if (!customer) return notFound()
    if (me().role === 'cashier') {
      return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
    }
    const input = (await request.json()) as Omit<CustomerInput, 'openingDebt'>
    const failed = checkInput(input, customer.id)
    if (failed) return failed
    Object.assign(customer, {
      name: input.name.trim(),
      phone: input.phone ? normalizePhone(input.phone) : '',
      creditAllowed: input.creditAllowed,
      debtLimit: input.debtLimit,
      notes: input.notes.trim(),
    })
    return HttpResponse.json({ data: customerView(customer) })
  }),

  http.get(apiUrl('/api/customers/:id/statement'), ({ params, request }) => {
    const customer = db.customers.find((item) => item.id === Number(params.id))
    if (!customer) return notFound()
    const period = (new URL(request.url).searchParams.get('period') ??
      'month') as CustomerStatementPeriod
    const from = periodStart(period)
    const entries = entriesOf(customer.id)
    const before = entries.filter((entry) => entry.at.slice(0, 10) < from)
    let balance = roundMoney(before.reduce((sum, entry) => sum + entry.debit - entry.credit, 0))
    const openingBalance = balance
    const lines: CustomerStatementLine[] = entries
      .filter((entry) => entry.at.slice(0, 10) >= from)
      .map((entry) => {
        balance = roundMoney(balance + entry.debit - entry.credit)
        return {
          id: entry.id,
          at: entry.at,
          kind: entry.kind,
          reference: entry.reference,
          invoiceId: entry.invoiceId,
          method: entry.method,
          actor: entry.actor,
          items: entry.items,
          debit: entry.debit,
          credit: entry.credit,
          balance,
        }
      })
    const month = db.today.slice(0, 7)
    const invoices = db.invoices
      .filter((invoice) => invoice.customerId === customer.id)
      .sort((a, b) => b.at.localeCompare(a.at))
    const seen = new Set<number>()
    const recent = invoices.flatMap((invoice) =>
      invoice.lines
        .filter((line) => !seen.has(line.productId) && seen.add(line.productId))
        .map((line) => ({ productId: line.productId, name: line.name, lastBought: invoice.at })),
    )
    // Old credit sales are only on the account; today's are on both, so count them once.
    const onInvoices = new Set(invoices.map((invoice) => invoice.number))
    const purchasesThisMonth = roundMoney(
      invoices
        .filter((invoice) => invoice.at.slice(0, 7) === month)
        .reduce((sum, invoice) => sum + invoice.total, 0) +
        entries
          .filter(
            (entry) =>
              entry.kind === 'sale' &&
              entry.at.slice(0, 7) === month &&
              !onInvoices.has(entry.reference),
          )
          .reduce((sum, entry) => sum + entry.debit, 0),
    )
    return HttpResponse.json({
      data: {
        customer: customerView(customer),
        period,
        from,
        openingBalance,
        lines,
        purchasesThisMonth,
        recent: recent.slice(0, 5),
      },
    })
  }),

  http.post(apiUrl('/api/customers/:id/payments'), async ({ params, request }) => {
    const customer = db.customers.find((item) => item.id === Number(params.id))
    if (!customer) return notFound()
    const input = (await request.json()) as CustomerPaymentInput
    const debt = debtOf(customer.id)
    if (!(input.amount > 0)) return invalid('amount', 'positive')
    if (input.amount > debt + 1e-9) return invalid('amount', 'tooMuch')
    const user = me()
    const receipts = db.customerEntries
      .filter((entry) => entry.kind === 'payment')
      .map((entry) => Number(entry.reference.replace(/\D/g, '')))
    const receipt = `R-${String(Math.max(0, ...receipts) + 1).padStart(4, '0')}`
    const open = db.shifts.find((shift) => shift.status === 'open')
    const at = new Date().toISOString()
    addCustomerEntry({
      customerId: customer.id,
      at,
      kind: 'payment',
      reference: receipt,
      invoiceId: null,
      method: input.method,
      actor: user.name.split(' ')[0] ?? user.name,
      items: null,
      debit: 0,
      credit: roundMoney(input.amount),
      shiftNumber: input.method === 'cash' ? (open?.number ?? null) : null,
    })
    return HttpResponse.json(
      {
        data: {
          receipt,
          amount: roundMoney(input.amount),
          balance: debtOf(customer.id),
          at,
        },
      },
      { status: 201 },
    )
  }),
]
