import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createExpense,
  EXPENSE_CATEGORIES,
  expenseQueries,
  type ExpenseCategory,
  type ExpenseSource,
} from '@/entities/expense'
import { shiftQueries } from '@/entities/shift'
import { ApiError } from '@/shared/api'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Field, Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

const select = 'h-10 rounded-lg border border-border bg-surface-100 px-3 text-body'

/**
 * One line to record an expense. Cash from the open shift's drawer is dated today and
 * lowers the cash that shift should hold at closing.
 */
export function ExpenseForm() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: current } = useQuery(shiftQueries.current())
  const shift = current?.shift ?? null
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState<ExpenseCategory>('generatorFuel')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [chosenSource, setSource] = useState<ExpenseSource | null>(null)
  const [note, setNote] = useState('')
  const [monthly, setMonthly] = useState(false)
  const [errors, setErrors] = useState<{ amount?: string; note?: string; source?: string }>({})
  // Until someone picks, drawer cash is the usual answer when a shift is open.
  const source: ExpenseSource = chosenSource ?? (shift ? 'drawer' : 'outside')

  const save = useMutation({
    mutationFn: () =>
      createExpense({
        category,
        amount: Number(amount),
        date: source === 'drawer' ? today : date,
        source,
        note: note.trim(),
        monthly,
      }),
    onSuccess: async (expense) => {
      await queryClient.invalidateQueries({ queryKey: expenseQueries.all })
      await queryClient.invalidateQueries({ queryKey: shiftQueries.all })
      toast.success(
        t('expenses.added', {
          category: t(`expenses.categories.${expense.category}`),
          amount: formatMoney(expense.amount),
        }),
      )
      setAmount('')
      setNote('')
      setMonthly(false)
    },
    onError: (failure) => {
      const fields = failure instanceof ApiError ? failure.fieldErrors : {}
      if (fields.source?.[0] === 'noShift') setErrors({ source: t('expenses.noShift') })
      else if (fields.note) setErrors({ note: t('expenses.noteRequired') })
      else if (fields.amount) setErrors({ amount: t('expenses.positive') })
      else toast.error(t('validation.serverError'))
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: typeof errors = {}
    if (!(Number(amount) > 0)) found.amount = t('expenses.positive')
    if (category === 'other' && !note.trim()) found.note = t('expenses.noteRequired')
    setErrors(found)
    if (Object.keys(found).length === 0) save.mutate()
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="expense-form"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-4"
    >
      <h2 id="expense-form" className="font-display text-body-strong">
        {t('expenses.addTitle')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_8rem_10rem_1.3fr_1.3fr_auto] xl:items-start">
        <Field label={t('expenses.category')}>
          {(field) => (
            <select
              {...field}
              value={category}
              onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
              className={select}
            >
              {EXPENSE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {t(`expenses.categories.${item}`)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label={t('expenses.amount')} error={errors.amount}>
          {(field) => (
            <Input
              {...field}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              className="tabular"
            />
          )}
        </Field>
        <Field label={t('expenses.date')}>
          {(field) => (
            <Input
              {...field}
              type="date"
              value={source === 'drawer' ? today : date}
              max={today}
              disabled={source === 'drawer'}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>
        <Field label={t('expenses.source')} error={errors.source}>
          {(field) => (
            <select
              {...field}
              value={source}
              onChange={(event) => setSource(event.target.value as ExpenseSource)}
              className={select}
            >
              <option value="drawer" disabled={!shift}>
                {shift
                  ? t('expenses.sources.drawer', { number: shift.number })
                  : t('expenses.sources.drawerClosed')}
              </option>
              <option value="outside">{t('expenses.sources.outside')}</option>
            </select>
          )}
        </Field>
        <Field label={t('expenses.note')} error={errors.note} optional={category !== 'other'}>
          {(field) => (
            <Input {...field} value={note} onChange={(event) => setNote(event.target.value)} />
          )}
        </Field>
        <div className="flex flex-col gap-2 xl:pt-7">
          <Button type="submit" disabled={save.isPending}>
            {t('expenses.add')}
          </Button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-small">
        <input
          type="checkbox"
          checked={monthly}
          onChange={(event) => setMonthly(event.target.checked)}
          className="size-4 accent-brand"
        />
        {t('expenses.monthly')}
      </label>
    </form>
  )
}
