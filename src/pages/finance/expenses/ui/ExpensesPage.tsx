import { Inbox } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EXPENSE_MONTHS, expenseQueries, type Expense, type ExpenseMonth } from '@/entities/expense'
import { ExpenseForm } from '@/features/expense/record-expense'
import { FinanceTabs } from '@/widgets/finance-tabs'
import { formatMonthYear } from '@/shared/lib/date'
import { downloadCsv } from '@/shared/lib/csv'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Segmented } from '@/shared/ui/segmented'
import { DataTable, type Column } from '@/shared/ui/table'

/** What running the pharmacy costs: add an expense, see the month by type, and every line. */
export function ExpensesPage() {
  const { t, i18n } = useTranslation()
  const [month, setMonth] = useState<ExpenseMonth>('this')
  const { data, isPending } = useQuery(expenseQueries.list(month))
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })
  const expenses = data?.data ?? []
  const summary = data?.summary
  const largest = Math.max(1, ...(summary?.byCategory.map((item) => item.total) ?? []))
  const source = (expense: Expense) =>
    expense.source === 'drawer' && expense.shiftNumber !== null
      ? t('expenses.fromDrawer', { number: expense.shiftNumber })
      : t('expenses.outside')

  const columns: Column<Expense>[] = [
    {
      id: 'date',
      header: t('expenses.columns.date'),
      cell: (expense) => <span className="tabular">{date.format(new Date(expense.date))}</span>,
    },
    {
      id: 'category',
      header: t('expenses.columns.category'),
      cell: (expense) => (
        <span className="flex items-center gap-2">
          {t(`expenses.categories.${expense.category}`)}
          {expense.monthly && <Badge tone="info">{t('expenses.monthlyBadge')}</Badge>}
        </span>
      ),
    },
    {
      id: 'amount',
      header: t('expenses.columns.amount'),
      numeric: true,
      cell: (expense) => <span className="font-semibold">{formatMoney(expense.amount)}</span>,
    },
    { id: 'source', header: t('expenses.columns.source'), cell: source },
    { id: 'actor', header: t('expenses.columns.actor'), cell: (expense) => expense.actor },
    {
      id: 'note',
      header: t('expenses.columns.note'),
      cell: (expense) => <span className="text-small text-ink-muted">{expense.note}</span>,
    },
  ]

  function exportList() {
    downloadCsv(`${t('expenses.exportFile')} ${summary?.month ?? ''}`.trim(), [
      [
        t('expenses.columns.date'),
        t('expenses.columns.category'),
        t('expenses.columns.amount'),
        t('expenses.columns.source'),
        t('expenses.columns.actor'),
        t('expenses.columns.note'),
      ],
      ...expenses.map((expense) => [
        expense.date,
        t(`expenses.categories.${expense.category}`),
        expense.amount,
        source(expense),
        expense.actor,
        expense.note,
      ]),
    ])
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('expenses.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('expenses.subtitle')}</p>
        </div>
        <Button variant="secondary" onClick={exportList} disabled={expenses.length === 0}>
          {t('finance.export')}
        </Button>
      </div>
      <FinanceTabs />

      <ExpenseForm />

      <div className="flex items-center gap-3">
        <span className="text-small text-ink-muted">{t('expenses.month')}</span>
        <Segmented<ExpenseMonth>
          label={t('expenses.month')}
          value={month}
          onChange={setMonth}
          options={EXPENSE_MONTHS.map((value) => ({
            value,
            label: t(`expenses.months.${value}`),
          }))}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[18rem_1fr]">
        {summary && (
          <section
            aria-labelledby="expenses-total"
            className="flex flex-col gap-4 self-start rounded-lg border border-border bg-surface-100 shadow-card p-4"
          >
            <div>
              <h2 id="expenses-total" className="text-small text-ink-muted">
                {t('expenses.total', { month: formatMonthYear(`${summary.month}-01`) })}
              </h2>
              <p className="tabular mt-1 font-display text-display">
                {formatMoney(summary.total)} ₪
              </p>
              <p className="text-small text-ink-muted">
                {t('expenses.previous', { amount: formatMoney(summary.previous) })}
              </p>
            </div>
            <ul aria-label={t('expenses.byCategory')} className="flex flex-col gap-3">
              {summary.byCategory.map((item) => (
                <li key={item.category} className="flex flex-col gap-1">
                  <span className="flex justify-between gap-2 text-small">
                    <span>{t(`expenses.categories.${item.category}`)}</span>
                    <span className="tabular font-semibold">{formatMoney(item.total)}</span>
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-pill bg-surface-200" aria-hidden>
                    <span
                      className="block h-full rounded-pill bg-brand"
                      style={{ width: `${(item.total / largest) * 100}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
            {!summary.byCategory.some((item) => item.category === 'salaries') && (
              <p className="rounded-md bg-surface-200 px-3 py-2 text-caption text-ink-muted">
                {t('expenses.salariesHint')}
              </p>
            )}
          </section>
        )}

        <DataTable
          caption={t('expenses.title')}
          columns={columns}
          rows={expenses}
          getRowId={(expense) => String(expense.id)}
          loading={isPending}
          empty={<EmptyState icon={<Inbox className="size-6" />} title={t('expenses.empty')} />}
        />
      </div>
    </div>
  )
}
