/** The usual running costs of a pharmacy. "other" takes anything else, with a note. */
export const EXPENSE_CATEGORIES = [
  'rent',
  'generatorSubscription',
  'generatorFuel',
  'maintenance',
  'supplies',
  'transport',
  'internet',
  'salaries',
  'other',
] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

/** Cash from the open shift's drawer lowers the cash it should hold; outside money does not. */
export type ExpenseSource = 'drawer' | 'outside'

export interface Expense {
  id: number
  date: string
  category: ExpenseCategory
  amount: number
  source: ExpenseSource
  /** The shift whose drawer paid it. */
  shiftNumber: number | null
  actor: string
  note: string
  /** Paid every month, like rent. */
  monthly: boolean
}

export interface ExpenseInput {
  category: ExpenseCategory
  amount: number
  date: string
  source: ExpenseSource
  note: string
  monthly: boolean
}

export const EXPENSE_MONTHS = ['this', 'last'] as const
export type ExpenseMonth = (typeof EXPENSE_MONTHS)[number]

export interface ExpenseList {
  data: Expense[]
  summary: {
    /** The month shown, as 2026-11. */
    month: string
    total: number
    /** The month before it, to compare. */
    previous: number
    byCategory: { category: ExpenseCategory; total: number }[]
  }
}
