import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { productQueries } from '@/entities/product'
import {
  COUNT_REASONS,
  approveCount,
  countQueries,
  saveCountLines,
  type CountReason,
  type StockCount,
} from '@/entities/stock-count'
import { cn } from '@/shared/lib/cn'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

type Filter = 'all' | 'diff' | 'pending' | 'matched'
const FILTERS: Filter[] = ['all', 'diff', 'pending', 'matched']

interface Entry {
  actual: string
  reason: CountReason | null
}

const keyOf = (line: { productId: number; batch: string }) => `${line.productId}:${line.batch}`

interface CountSheetProps {
  count: StockCount
  /** The manager, or a pharmacist given the permission. */
  canApprove: boolean
}

/**
 * The open count: what the system expects for each batch, what was counted, the
 * difference and its reason. Saved as it goes; approving adjusts stock.
 */
export function CountSheet({ count, canApprove }: CountSheetProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')
  const [confirming, setConfirming] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(
      count.lines.map((line) => [
        keyOf(line),
        { actual: line.actual === null ? '' : String(line.actual), reason: line.reason },
      ]),
    ),
  )

  const rows = count.lines.map((line) => {
    const entry = entries[keyOf(line)] ?? { actual: '', reason: null }
    const actual = entry.actual.trim() === '' ? null : Number(entry.actual)
    const diff = actual === null || Number.isNaN(actual) ? null : actual - line.expected
    return { line, entry, actual, diff }
  })
  const counted = rows.filter((row) => row.diff !== null)
  const differing = counted.filter((row) => row.diff !== 0)
  const pending = rows.length - counted.length
  const value = roundMoney(differing.reduce((sum, row) => sum + (row.diff ?? 0) * row.line.cost, 0))
  const shown = rows.filter((row) =>
    filter === 'all'
      ? true
      : filter === 'pending'
        ? row.diff === null
        : filter === 'diff'
          ? row.diff !== null && row.diff !== 0
          : row.diff === 0,
  )
  const counts: Record<Filter, number> = {
    all: rows.length,
    diff: differing.length,
    pending,
    matched: counted.length - differing.length,
  }

  function set(key: string, patch: Partial<Entry>) {
    setEntries((current) => ({
      ...current,
      [key]: { ...(current[key] ?? { actual: '', reason: null }), ...patch },
    }))
  }

  const payload = () =>
    rows.map(({ line, actual, entry }) => ({
      productId: line.productId,
      batch: line.batch,
      actual: actual !== null && !Number.isNaN(actual) ? actual : null,
      reason: entry.reason,
    }))

  const save = useMutation({
    mutationFn: () => saveCountLines(count.id, payload()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: countQueries.all })
      toast.success(t('counts.saved'))
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  const approve = useMutation({
    mutationFn: async () => {
      await saveCountLines(count.id, payload())
      return approveCount(count.id)
    },
    onSuccess: async () => {
      setConfirming(false)
      await queryClient.invalidateQueries({ queryKey: countQueries.all })
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      toast.success(t('counts.approvedToast', { count: differing.length }))
    },
    onError: () => {
      setConfirming(false)
      toast.error(t('validation.serverError'))
    },
  })

  function askToApprove() {
    setProblem(null)
    if (differing.some((row) => !row.entry.reason)) setProblem(t('counts.needReasons'))
    else setConfirming(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ['counted', `${counted.length} / ${rows.length}`],
            ['matched', String(counts.matched)],
            ['different', String(differing.length)],
            ['value', `${value < 0 ? '− ' : ''}${formatMoney(Math.abs(value))} ₪`],
          ] as const
        ).map(([key, text]) => (
          <div key={key} className="rounded-lg border border-border bg-surface-100 p-4">
            <dt className="text-small text-ink-muted">{t(`counts.${key}`)}</dt>
            <dd
              className={cn(
                'tabular mt-1 font-display text-title',
                key === 'value' && value < 0 && 'text-danger',
              )}
            >
              <bdi dir="ltr">{text}</bdi>
            </dd>
          </div>
        ))}
      </dl>

      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">{t('counts.title')}</legend>
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={cn(
              'rounded-pill border px-3 py-1 text-small',
              filter === item
                ? 'border-brand bg-brand-soft font-semibold text-brand-strong'
                : 'border-border text-ink-muted hover:bg-surface-200',
            )}
          >
            {t(`counts.filters.${item}`)} · {counts[item]}
          </button>
        ))}
      </fieldset>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface-100">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">{t('counts.title')}</caption>
          <thead>
            <tr className="border-b border-border text-small text-ink-muted">
              {(['product', 'batch', 'expected', 'actual', 'diff', 'reason'] as const).map(
                (column) => (
                  <th key={column} className="px-4 py-3 text-start font-semibold whitespace-nowrap">
                    {t(`counts.columns.${column}`)}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {shown.map(({ line, entry, diff }) => {
              const key = keyOf(line)
              const missingReason = problem !== null && diff !== null && diff !== 0 && !entry.reason
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-b border-border last:border-0',
                    diff !== null && diff !== 0 && 'bg-warning-soft/30',
                  )}
                >
                  <th scope="row" className="px-4 py-2.5 text-start font-semibold">
                    <bdi>{line.name}</bdi>
                  </th>
                  <td className="px-4 py-2.5">
                    <bdi dir="ltr" className="tabular text-ink-muted">
                      {line.batch}
                    </bdi>
                  </td>
                  <td className="tabular px-4 py-2.5">{line.expected}</td>
                  <td className="px-4 py-2.5">
                    <Input
                      aria-label={t('counts.actualOf', { name: line.name, batch: line.batch })}
                      value={entry.actual}
                      onChange={(event) => set(key, { actual: event.target.value })}
                      inputMode="numeric"
                      className="tabular h-9 w-20"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {diff === null ? (
                      <span className="text-ink-muted">—</span>
                    ) : (
                      <bdi
                        dir="ltr"
                        className={cn(
                          'tabular font-semibold',
                          diff < 0 && 'text-danger',
                          diff > 0 && 'text-success',
                        )}
                      >
                        {diff > 0 ? `+ ${diff}` : diff < 0 ? `− ${-diff}` : '0'}
                      </bdi>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {diff !== null && diff !== 0 && (
                      <select
                        aria-label={t('counts.reasonOf', { name: line.name, batch: line.batch })}
                        value={entry.reason ?? ''}
                        onChange={(event) =>
                          set(key, { reason: (event.target.value || null) as CountReason | null })
                        }
                        aria-invalid={missingReason ? true : undefined}
                        className={cn(
                          'h-9 rounded-md border bg-surface-100 px-2 text-small',
                          missingReason ? 'border-danger' : 'border-border-strong',
                        )}
                      >
                        <option value="">{t('counts.chooseReason')}</option>
                        {COUNT_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {t(`counts.reasons.${reason}`)}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pending > 0 && (
        <p className="text-small text-ink-muted">{t('counts.pendingNote', { count: pending })}</p>
      )}
      {problem && (
        <p role="alert" className="text-small text-danger">
          {problem}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate()}>
          {t('counts.save')}
        </Button>
        {canApprove ? (
          <Button disabled={approve.isPending || counted.length === 0} onClick={askToApprove}>
            {t('counts.approve')}
          </Button>
        ) : (
          <span className="text-small text-ink-muted">{t('counts.approveOnly')}</span>
        )}
      </div>
      <p className="text-caption text-ink-muted">{t('counts.approveNote')}</p>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => approve.mutate()}
        title={t('counts.approveTitle', { count: differing.length })}
        message={t('counts.approveBody', {
          amount: `${value < 0 ? '−' : ''}${formatMoney(Math.abs(value))}`,
        })}
        confirmLabel={t('counts.approve')}
        busy={approve.isPending}
      />
    </div>
  )
}
