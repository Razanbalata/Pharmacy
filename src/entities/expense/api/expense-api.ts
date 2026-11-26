import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { http } from '@/shared/api'
import type { Expense, ExpenseInput, ExpenseList, ExpenseMonth } from '../model/types'

export async function listExpenses(month: ExpenseMonth): Promise<ExpenseList> {
  return http.get<ExpenseList>('/api/expenses', { query: { month } })
}

/** Drawer cash needs an open shift (422 `source: noShift`). */
export async function createExpense(input: ExpenseInput): Promise<Expense> {
  return (await http.post<{ data: Expense }>('/api/expenses', input)).data
}

export const expenseQueries = {
  all: ['expenses'] as const,
  list: (month: ExpenseMonth) =>
    queryOptions({
      queryKey: [...expenseQueries.all, month],
      queryFn: () => listExpenses(month),
      placeholderData: keepPreviousData,
    }),
}
