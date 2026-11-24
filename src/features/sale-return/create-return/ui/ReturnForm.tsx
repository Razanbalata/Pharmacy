import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { damageQueries } from '@/entities/damage-record'
import { invoiceQueries, type Invoice } from '@/entities/invoice'
import { pharmacyQueries } from '@/entities/pharmacy'
import { productQueries } from '@/entities/product'
import {
  RETURN_REASONS,
  createReturn,
  type RefundMethod,
  type ReturnDestination,
  type ReturnReason,
} from '@/entities/sale-return'
import { useCurrentUser } from '@/entities/session'
import { shiftQueries } from '@/entities/shift'
import { staffQueries } from '@/entities/staff-member'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { toast } from '@/shared/ui/toast'

interface Entry {
  quantity: number
  reason: ReturnReason
  destination: ReturnDestination
}

interface ReturnFormProps {
  invoice: Invoice
  onDone: () => void
}

/**
 * What comes back from one invoice, where it goes, and how the money is returned.
 * A pharmacist or the manager approves; a cashier cannot return alone.
 */
export function ReturnForm({ invoice, onDone }: ReturnFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const { data: staff = [] } = useQuery(staffQueries.list())
  const { data: settings } = useQuery(pharmacyQueries.settings())
  const returnDays = settings?.sale.returnDays ?? 14
  // Read once when the form opens: how many days since the sale.
  const [ageDays] = useState(() => Math.floor((Date.now() - Date.parse(invoice.at)) / 86_400_000))
  const left = returnDays - ageDays
  const approvers = staff.filter((member) => member.active && member.role !== 'cashier')
  const self = user && 'pharmacy' in user && user.role !== 'cashier' ? user.id : null

  const [entries, setEntries] = useState<Record<number, Entry>>({})
  const [refund, setRefund] = useState<RefundMethod>('cash')
  const [approverId, setApproverId] = useState<number | null>(self)
  const [problem, setProblem] = useState<string | null>(null)

  const share = invoice.subtotal > 0 ? invoice.total / invoice.subtotal : 1
  const lines = invoice.lines.map((line) => {
    const entry = entries[line.productId] ?? {
      quantity: 0,
      reason: 'notNeeded',
      destination: 'stock',
    }
    return { line, entry, available: line.quantity - line.returned }
  })
  const amount = roundMoney(
    lines.reduce((sum, { line, entry }) => sum + line.price * entry.quantity * share, 0),
  )
  const chosen = lines.filter(({ entry }) => entry.quantity > 0)

  const set = (productId: number, patch: Partial<Entry>) =>
    setEntries((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? { quantity: 0, reason: 'notNeeded', destination: 'stock' }),
        ...patch,
      },
    }))

  const save = useMutation({
    mutationFn: () =>
      createReturn({
        invoiceId: invoice.id,
        refund,
        approverId: approverId ?? 0,
        lines: chosen.map(({ line, entry }) => ({
          productId: line.productId,
          batch: line.batch,
          quantity: entry.quantity,
          reason: entry.reason,
          destination: entry.destination,
        })),
      }),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invoiceQueries.all }),
        queryClient.invalidateQueries({ queryKey: productQueries.all }),
        queryClient.invalidateQueries({ queryKey: shiftQueries.all }),
        queryClient.invalidateQueries({ queryKey: damageQueries.all }),
      ])
      toast.success(
        t('returns.done', { number: result.number, amount: formatMoney(result.amount) }),
      )
      window.print()
      onDone()
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  function confirm() {
    setProblem(null)
    if (chosen.length === 0) setProblem(t('returns.nothing'))
    else if (approverId === null) setProblem(t('returns.needApprover'))
    else save.mutate()
  }

  if (left < 0) {
    return (
      <p className="rounded-md bg-danger-soft px-3 py-2 text-danger">
        {t('returns.tooOld', { days: returnDays })}
      </p>
    )
  }
  if (lines.every(({ available }) => available <= 0)) {
    return <p className="rounded-md bg-surface-200 px-3 py-2">{t('returns.fullyReturned')}</p>
  }

  const refunds: RefundMethod[] = invoice.customer ? ['cash', 'bank', 'debt'] : ['cash', 'bank']

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-5">
        <p className="text-small text-success">{t('returns.withinPeriod', { count: left })}</p>
        <section
          aria-labelledby="return-lines"
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-5"
        >
          <h2 id="return-lines" className="font-display text-body-strong">
            2 · {t('returns.stepLines')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <caption className="sr-only">{t('returns.stepLines')}</caption>
              <thead>
                <tr className="border-b border-border text-small text-ink-muted">
                  {(
                    [
                      'product',
                      'sold',
                      'before',
                      'quantity',
                      'reason',
                      'destination',
                      'amount',
                    ] as const
                  ).map((column) => (
                    <th
                      key={column}
                      className="px-2 py-2 text-start font-semibold whitespace-nowrap"
                    >
                      {t(`returns.columns.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map(({ line, entry, available }) => (
                  <tr key={line.productId} className="border-b border-border last:border-0">
                    <th scope="row" className="px-2 py-2.5 text-start font-normal">
                      <bdi className="block font-semibold">{line.name}</bdi>
                      <span className="text-caption text-ink-muted">
                        {line.unit} · {formatMoney(line.price)}
                      </span>
                    </th>
                    <td className="tabular px-2 py-2.5">{line.quantity}</td>
                    <td className="tabular px-2 py-2.5">{line.returned || '—'}</td>
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label={t('returns.decrease', { name: line.name })}
                          disabled={entry.quantity <= 0}
                          onClick={() => set(line.productId, { quantity: entry.quantity - 1 })}
                        >
                          −
                        </Button>
                        <output
                          aria-label={t('returns.quantityOf', { name: line.name })}
                          className="tabular w-8 text-center font-semibold"
                        >
                          {entry.quantity}
                        </output>
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label={t('returns.increase', { name: line.name })}
                          disabled={entry.quantity >= available}
                          onClick={() => set(line.productId, { quantity: entry.quantity + 1 })}
                        >
                          +
                        </Button>
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <select
                        aria-label={t('returns.reasonOf', { name: line.name })}
                        value={entry.reason}
                        onChange={(event) =>
                          set(line.productId, { reason: event.target.value as ReturnReason })
                        }
                        disabled={entry.quantity === 0}
                        className="h-9 rounded-md border border-border-strong bg-surface-100 px-2 text-small disabled:opacity-50"
                      >
                        {RETURN_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {t(`returns.reasons.${reason}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2.5">
                      {entry.quantity > 0 && (
                        <Segmented<ReturnDestination>
                          label={t('returns.destinationOf', { name: line.name })}
                          value={entry.destination}
                          onChange={(destination) => set(line.productId, { destination })}
                          options={[
                            { value: 'stock', label: t('returns.toStock') },
                            { value: 'damage', label: t('returns.toDamage') },
                          ]}
                        />
                      )}
                    </td>
                    <td className="tabular px-2 py-2.5">
                      {entry.quantity > 0 ? formatMoney(line.price * entry.quantity * share) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          aria-labelledby="return-refund"
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-5"
        >
          <h2 id="return-refund" className="font-display text-body-strong">
            3 · {t('returns.stepRefund')}
          </h2>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t('returns.stepRefund')}</legend>
            {refunds.map((method) => (
              <label key={method} className="flex items-center gap-2 text-body">
                <input
                  type="radio"
                  name="refund"
                  checked={refund === method}
                  onChange={() => setRefund(method)}
                  className="accent-brand"
                />
                {method === 'debt'
                  ? t('returns.refunds.debt', { name: invoice.customer?.name ?? '' })
                  : t(`returns.refunds.${method}`)}
              </label>
            ))}
          </fieldset>
          <Field
            label={t('returns.approver')}
            hint={t('returns.approverHint')}
            className="max-w-xs"
          >
            {(field) => (
              <select
                {...field}
                value={approverId ?? ''}
                onChange={(event) =>
                  setApproverId(event.target.value ? Number(event.target.value) : null)
                }
                className="h-10 rounded-md border border-border-strong bg-surface-100 px-3 text-body"
              >
                <option value="">{t('returns.chooseApprover')}</option>
                {approvers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {t(`role.${member.role}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </section>
      </div>

      <aside className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-4 lg:sticky lg:top-20">
        <h2 className="font-display text-body-strong">{t('returns.summary')}</h2>
        <ul className="flex flex-col gap-1 text-small">
          {chosen.map(({ line, entry }) => (
            <li key={line.productId}>
              <span className="text-ink-muted">
                {entry.destination === 'stock'
                  ? t('returns.backToStock')
                  : t('returns.toDamageLine')}
              </span>{' '}
              {entry.quantity} × <bdi>{line.name}</bdi>
            </li>
          ))}
        </ul>
        {chosen.length > 0 && (
          <p className="text-caption text-ink-muted">
            {t('returns.batch')}: {t('returns.sameBatch')}
          </p>
        )}
        <p className="flex items-baseline justify-between border-t border-border pt-2">
          <span>{t('returns.amount')}</span>
          <span className="tabular font-display text-title">{formatMoney(amount)} ₪</span>
        </p>
        {problem && (
          <p role="alert" className="text-small text-danger">
            {problem}
          </p>
        )}
        <Button size="lg" disabled={save.isPending} onClick={confirm}>
          {t('returns.confirm')}
        </Button>
      </aside>
    </div>
  )
}
