import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { invoiceQueries } from '@/entities/invoice'
import { closeShift, shiftQueries, type ShiftSummary } from '@/entities/shift'
import { cn } from '@/shared/lib/cn'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Field, Input, Textarea } from '@/shared/ui/field'
import { SkeletonRows } from '@/shared/ui/skeleton'
import { toast } from '@/shared/ui/toast'

interface CloseShiftFormProps {
  onClosed: () => void
  onShowHeld: () => void
}

/** End of the day: what the drawer should hold, line by line, against what was counted. */
export function CloseShiftForm({ onClosed, onShowHeld }: CloseShiftFormProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { data: summary } = useQuery(shiftQueries.summary())
  const [counted, setCounted] = useState('')
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string | undefined>()

  const close = useMutation({
    mutationFn: () => closeShift({ countedCash: Number(counted), note: note.trim() }),
    onSuccess: async (closed) => {
      await queryClient.invalidateQueries({ queryKey: shiftQueries.all })
      await queryClient.invalidateQueries({ queryKey: invoiceQueries.all })
      toast.success(t('shift.closed', { number: closed.shift.number }))
      window.print()
      onClosed()
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  if (!summary) return <SkeletonRows rows={6} />
  const value = Number(counted)
  const hasCount = counted.trim() !== '' && Number.isFinite(value)
  const difference = hasCount ? roundMoney(value - summary.expectedCash) : 0
  const time = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setNoteError(undefined)
    if (!hasCount) return
    if (difference !== 0 && !note.trim()) {
      setNoteError(t('shift.noteRequired'))
      return
    }
    close.mutate()
  }

  const lines: [keyof ShiftSummary | 'opening', number, string | null, 1 | -1 | 0][] = [
    ['opening', summary.shift.openingCash, null, 1],
    ['cashSales', summary.cashSales, null, 1],
    ['debtPayments', summary.debtPayments, null, 1],
    ['bankSales', summary.bankSales, t('shift.lines.bankNote'), 0],
    ['creditSales', summary.creditSales, t('shift.lines.creditNote'), 0],
    ['cashRefunds', summary.cashRefunds, null, -1],
    ['supplierPayments', summary.supplierPayments, null, -1],
  ]

  // Debt paid in cash only shows on the shifts that took some.
  const shown = lines.filter(([key, amount]) => key !== 'debtPayments' || amount > 0)

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="close-shift"
      className="print-area flex w-full max-w-lg flex-col gap-4 rounded-lg border border-border bg-surface-100 p-6"
    >
      <div>
        <h1 id="close-shift" className="font-display text-title">
          {t('shift.closeTitle', { number: summary.shift.number })}
        </h1>
        <p className="mt-1 text-small text-ink-muted">
          {t('shift.closeMeta', {
            name: summary.shift.cashier.name,
            from: time.format(new Date(summary.shift.openedAt)),
            count: summary.invoiceCount,
          })}
        </p>
      </div>

      {summary.heldCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
          <span>{t('shift.heldWarning', { count: summary.heldCount })}</span>
          <Button size="sm" variant="secondary" onClick={onShowHeld}>
            {t('shift.showHeld')}
          </Button>
        </div>
      )}

      <dl className="flex flex-col divide-y divide-border rounded-md border border-border">
        {shown.map(([key, amount, aside, sign]) => (
          <div key={key} className="flex items-center justify-between px-3 py-2">
            <dt>
              {t(`shift.lines.${key as 'opening'}`)}
              {aside && <span className="ms-1 text-caption text-ink-muted">· {aside}</span>}
            </dt>
            <dd className={cn('tabular', sign === 0 && 'text-ink-muted')}>
              <bdi dir="ltr">
                {sign === -1 && amount > 0 ? '− ' : sign === 1 && key !== 'opening' ? '+ ' : ''}
                {formatMoney(amount)}
              </bdi>
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between bg-surface-200 px-3 py-2.5 font-semibold">
          <dt>{t('shift.expected')}</dt>
          <dd className="tabular font-display text-title">{formatMoney(summary.expectedCash)} ₪</dd>
        </div>
      </dl>

      <Field label={t('shift.counted')}>
        {(field) => (
          <span className="flex items-center gap-2">
            <Input
              {...field}
              value={counted}
              onChange={(event) => setCounted(event.target.value)}
              inputMode="decimal"
              className="tabular w-40 text-title"
            />
            <span className="text-ink-muted">₪</span>
          </span>
        )}
      </Field>

      {hasCount && (
        <p
          className={cn(
            'flex justify-between rounded-md px-3 py-2 font-semibold',
            difference < 0 && 'bg-danger-soft text-danger',
            difference > 0 && 'bg-warning-soft text-warning',
            difference === 0 && 'bg-success-soft text-success',
          )}
        >
          <span>
            {t('shift.difference')} ·{' '}
            {difference < 0
              ? t('shift.shortage')
              : difference > 0
                ? t('shift.surplus')
                : t('shift.balanced')}
          </span>
          <bdi dir="ltr" className="tabular">
            {difference < 0 ? '− ' : difference > 0 ? '+ ' : ''}
            {formatMoney(Math.abs(difference))} ₪
          </bdi>
        </p>
      )}

      {hasCount && difference !== 0 && (
        <Field label={t('shift.note')} hint={t('shift.noteRequired')} error={noteError}>
          {(field) => (
            <Textarea
              {...field}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
            />
          )}
        </Field>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={!hasCount || summary.heldCount > 0 || close.isPending}
      >
        {t('shift.close')}
      </Button>
    </form>
  )
}
