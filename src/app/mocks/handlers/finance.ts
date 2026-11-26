import { http, HttpResponse } from 'msw'
import type { Expense, ExpenseInput } from '@/entities/expense'
import { EXPENSE_CATEGORIES } from '@/entities/expense'
import type { ShiftRecord } from '@/entities/shift'
import { roundMoney } from '@/shared/lib/money'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { mockRole, users } from '../fixtures'
import type { StoredShift } from '../sales-data'
import { shiftView } from './sales'

const DAY_MS = 86_400_000

function invalid(field: string, code: string) {
  return HttpResponse.json(
    { message: 'The given data was invalid.', errors: { [field]: [code] } },
    { status: 422 },
  )
}

function me() {
  const role = mockRole()
  return role && role !== 'platform' ? users[role] : users.manager
}

function inPeriod(iso: string, period: string): boolean {
  const today = Date.parse(`${db.today}T00:00:00Z`)
  if (period === 'today') return iso.slice(0, 10) === db.today
  if (period === 'week') return Date.parse(iso) >= today - 6 * DAY_MS
  return iso.slice(0, 7) === db.today.slice(0, 7)
}

function record(shift: StoredShift): ShiftRecord {
  const sales =
    shift.archivedSales ??
    db.invoices
      .filter((invoice) => invoice.shiftNumber === shift.number)
      .reduce((sum, invoice) => sum + invoice.total, 0)
  const closed = shift.status === 'closed' && shift.expectedCash !== null
  return {
    ...shiftView(shift),
    sales: roundMoney(sales),
    expectedCash: closed ? shift.expectedCash : null,
    countedCash: closed ? shift.countedCash : null,
    difference:
      closed && shift.countedCash !== null && shift.expectedCash !== null
        ? roundMoney(shift.countedCash - shift.expectedCash)
        : null,
    note: shift.note,
  }
}

/** First of the month, `back` months before today's. */
function monthOf(back: number): string {
  const [year, month] = db.today.split('-').map(Number) as [number, number]
  return new Date(Date.UTC(year, month - 1 - back, 1)).toISOString().slice(0, 7)
}

export const financeHandlers = [
  http.get(apiUrl('/api/shifts'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const period = query.get('period') ?? 'week'
    const cashier = query.get('cashier')
    const onlyDifference = query.get('difference') === '1'
    const inRange = db.shifts
      .filter(
        (shift) =>
          inPeriod(shift.openedAt, period) && (!cashier || shift.cashierId === Number(cashier)),
      )
      .map(record)
      .sort((a, b) => b.number - a.number)
    const closed = inRange.filter((shift) => shift.difference !== null)
    const open = db.shifts.find((shift) => shift.status === 'open')
    return HttpResponse.json({
      data: onlyDifference ? closed.filter((shift) => shift.difference !== 0) : inRange,
      summary: {
        open: open ? { number: open.number, cashier: open.cashierName } : null,
        count: inRange.length,
        totalDifference: roundMoney(
          closed.reduce((sum, shift) => sum + (shift.difference ?? 0), 0),
        ),
        shortCount: closed.filter((shift) => (shift.difference ?? 0) < 0).length,
      },
    })
  }),

  http.get(apiUrl('/api/expenses'), ({ request }) => {
    const back = new URL(request.url).searchParams.get('month') === 'last' ? 1 : 0
    const month = monthOf(back)
    const previous = monthOf(back + 1)
    const sum = (list: Expense[]) =>
      roundMoney(list.reduce((total, item) => total + item.amount, 0))
    const inMonth = db.expenses
      .filter((expense) => expense.date.slice(0, 7) === month)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    const byCategory = EXPENSE_CATEGORIES.map((category) => ({
      category,
      total: sum(inMonth.filter((expense) => expense.category === category)),
    }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
    return HttpResponse.json({
      data: inMonth,
      summary: {
        month,
        total: sum(inMonth),
        previous: sum(db.expenses.filter((expense) => expense.date.slice(0, 7) === previous)),
        byCategory,
      },
    })
  }),

  http.post(apiUrl('/api/expenses'), async ({ request }) => {
    if (me().role !== 'manager') {
      return HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })
    }
    const input = (await request.json()) as ExpenseInput
    if (!EXPENSE_CATEGORIES.includes(input.category)) return invalid('category', 'invalid')
    if (!(input.amount > 0)) return invalid('amount', 'positive')
    const now = new Date().toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date > now) {
      return invalid('date', 'invalid')
    }
    if (input.category === 'other' && !input.note.trim()) return invalid('note', 'required')
    const open = db.shifts.find((shift) => shift.status === 'open')
    if (input.source === 'drawer' && !open) return invalid('source', 'noShift')
    const user = me()
    const expense: Expense = {
      id: Math.max(0, ...db.expenses.map((item) => item.id)) + 1,
      // Drawer cash leaves the drawer now, so it is today's whatever was sent.
      date: input.source === 'drawer' ? now : input.date,
      category: input.category,
      amount: roundMoney(input.amount),
      source: input.source,
      shiftNumber: input.source === 'drawer' ? (open?.number ?? null) : null,
      actor: user.name.split(' ')[0] ?? user.name,
      note: input.note.trim(),
      monthly: input.monthly,
    }
    db.expenses.push(expense)
    return HttpResponse.json({ data: expense }, { status: 201 })
  }),
]
