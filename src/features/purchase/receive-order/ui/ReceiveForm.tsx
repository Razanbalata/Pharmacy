import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { productQueries } from '@/entities/product'
import {
  purchaseQueries,
  receiveOrder,
  type PurchaseOrder,
  type ReceiveResult,
} from '@/entities/purchase-order'
import { supplierQueries, type PaymentMethod } from '@/entities/supplier'
import { cn } from '@/shared/lib/cn'
import { daysUntil, monthsUntil } from '@/shared/lib/date'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Field, Input } from '@/shared/ui/field'
import { toast } from '@/shared/ui/toast'

type Source = 'drawer' | 'cash' | 'bank' | 'cheque'
const SOURCES: Source[] = ['drawer', 'cash', 'bank', 'cheque']
const METHOD: Record<Source, PaymentMethod> = {
  drawer: 'cash',
  cash: 'cash',
  bank: 'bank',
  cheque: 'cheque',
}

/** Six months or less left: still received, but only after a second look. */
const SHORT_LIFE_MONTHS = 6

interface Line {
  productId: number
  name: string
  unit: string
  /** Still to come: ordered minus what arrived before. */
  remaining: number
  before: number
  received: string
  batch: string
  expiry: string
  cost: string
}

interface ReceiveFormProps {
  order: PurchaseOrder
  onDone: (result: ReceiveResult) => void
}

/**
 * What actually arrived: quantity, batch and expiry for each product, and what was paid.
 * Confirming adds the batches to stock and the invoice to the supplier's account.
 */
export function ReceiveForm({ order, onDone }: ReceiveFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [invoice, setInvoice] = useState('')
  const [lines, setLines] = useState<Line[]>(() =>
    order.lines
      .filter((line) => line.received < line.quantity)
      .map((line) => ({
        productId: line.productId,
        name: line.name,
        unit: line.unit,
        remaining: line.quantity - line.received,
        before: line.received,
        received: String(line.quantity - line.received),
        batch: '',
        expiry: '',
        cost: String(line.cost),
      })),
  )
  const [paid, setPaid] = useState('0')
  const [source, setSource] = useState<Source>('drawer')
  const [checked, setChecked] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const update = (productId: number, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.productId === productId ? { ...line, ...patch } : line)),
    )

  const quantity = (line: Line) => Math.max(0, Number(line.received) || 0)
  const orderedValue = roundMoney(
    lines.reduce((sum, line) => sum + line.remaining * (Number(line.cost) || 0), 0),
  )
  const receivedValue = roundMoney(
    lines.reduce((sum, line) => sum + quantity(line) * (Number(line.cost) || 0), 0),
  )
  const paidValue = Math.max(0, Number(paid) || 0)
  const shorts = lines.filter((line) => quantity(line) < line.remaining)

  function lineErrors(line: Line): { batch?: string; expiry?: string } {
    if (quantity(line) === 0) return {}
    return {
      ...(line.batch.trim() ? {} : { batch: t('purchases.receive.batchRequired') }),
      ...(!line.expiry
        ? { expiry: t('purchases.receive.expiryRequired') }
        : daysUntil(line.expiry) <= 0
          ? { expiry: t('purchases.receive.expired') }
          : {}),
    }
  }

  const receive = useMutation({
    mutationFn: () =>
      receiveOrder(order.id, {
        supplierInvoice: invoice.trim(),
        lines: lines.map((line) => ({
          productId: line.productId,
          received: quantity(line),
          batch: line.batch.trim(),
          expiry: line.expiry,
          cost: Number(line.cost) || 0,
        })),
        payment: { amount: paidValue, method: METHOD[source], fromDrawer: source === 'drawer' },
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: purchaseQueries.all })
      await queryClient.invalidateQueries({ queryKey: supplierQueries.all })
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      toast.success(t('purchases.receive.done', { number: order.number }))
      onDone(result)
    },
    onError: () => toast.error(t('validation.serverError')),
  })

  function confirm() {
    setChecked(true)
    setProblem(null)
    if (lines.every((line) => quantity(line) === 0)) {
      setProblem(t('purchases.receive.nothing'))
    } else if (lines.some((line) => Object.keys(lineErrors(line)).length > 0)) {
      setProblem(t('purchases.receive.fixLines'))
    } else if (paidValue > receivedValue + 0.001) {
      setProblem(t('purchases.receive.paidTooMuch'))
    } else {
      receive.mutate()
    }
  }

  const cell = 'px-2 py-2.5 align-top'

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-5">
        <Field label={t('purchases.receive.invoice')} optional className="max-w-xs">
          {(field) => (
            <Input
              {...field}
              value={invoice}
              onChange={(event) => setInvoice(event.target.value)}
              dir="ltr"
              className="text-start"
            />
          )}
        </Field>
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <caption className="sr-only">
              {t('purchases.receive.title', { number: order.number })}
            </caption>
            <thead>
              <tr className="border-b border-border text-small text-ink-muted">
                {(
                  ['product', 'ordered', 'received', 'batch', 'expiry', 'cost', 'total'] as const
                ).map((column) => (
                  <th
                    key={column}
                    className={cn(
                      'px-2 py-2 font-semibold',
                      column === 'total' ? 'text-end' : 'text-start',
                    )}
                  >
                    {t(`purchases.receive.columns.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const errors = checked ? lineErrors(line) : {}
                const months =
                  line.expiry && daysUntil(line.expiry) > 0 ? monthsUntil(line.expiry) : null
                const shortLife = months !== null && months < SHORT_LIFE_MONTHS
                const short = line.remaining - quantity(line)
                return (
                  <tr
                    key={line.productId}
                    className={cn(
                      'border-b border-border last:border-0',
                      (shortLife || errors.expiry) && 'bg-danger-soft/40',
                      !shortLife && short > 0 && 'bg-warning-soft/40',
                    )}
                  >
                    <th scope="row" className={`${cell} min-w-48 text-start font-normal`}>
                      <bdi className="block font-semibold">{line.name}</bdi>
                      {short > 0 && (
                        <span className="block text-caption text-warning">
                          {t('purchases.receive.short', { count: short })}
                        </span>
                      )}
                      {shortLife && (
                        <span className="block text-caption text-danger">
                          {t('purchases.receive.soon', { count: months })}
                        </span>
                      )}
                    </th>
                    <td className={`${cell} tabular`}>
                      {line.remaining}
                      {line.before > 0 && (
                        <span className="block text-caption text-ink-muted">
                          {t('purchases.receive.before', { count: line.before })}
                        </span>
                      )}
                    </td>
                    <td className={cell}>
                      <Input
                        aria-label={t('purchases.receive.receivedOf', { product: line.name })}
                        value={line.received}
                        onChange={(event) =>
                          update(line.productId, { received: event.target.value })
                        }
                        inputMode="numeric"
                        className={cn('tabular h-9 w-16', short > 0 && 'border-warning')}
                      />
                    </td>
                    <td className={cell}>
                      <Input
                        aria-label={t('purchases.receive.batchOf', { product: line.name })}
                        value={line.batch}
                        onChange={(event) => update(line.productId, { batch: event.target.value })}
                        aria-invalid={errors.batch ? true : undefined}
                        dir="ltr"
                        className="h-9 w-28 text-start"
                      />
                      {errors.batch && (
                        <span className="block text-caption text-danger">{errors.batch}</span>
                      )}
                    </td>
                    <td className={cell}>
                      <Input
                        type="date"
                        aria-label={t('purchases.receive.expiryOf', { product: line.name })}
                        value={line.expiry}
                        onChange={(event) => update(line.productId, { expiry: event.target.value })}
                        aria-invalid={errors.expiry ? true : undefined}
                        className="h-9 w-40"
                      />
                      {errors.expiry && (
                        <span className="block text-caption text-danger">{errors.expiry}</span>
                      )}
                    </td>
                    <td className={cell}>
                      <Input
                        aria-label={t('purchases.receive.costOf', { product: line.name })}
                        value={line.cost}
                        onChange={(event) => update(line.productId, { cost: event.target.value })}
                        inputMode="decimal"
                        className="tabular h-9 w-20"
                      />
                    </td>
                    <td className={`${cell} tabular text-end`}>
                      {formatMoney(quantity(line) * (Number(line.cost) || 0))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-4">
          <h2 className="font-display text-body-strong">{t('purchases.receive.payTitle')}</h2>
          <Field label={t('purchases.receive.paidNow')}>
            {(field) => (
              <span className="flex items-center gap-2">
                <Input
                  {...field}
                  value={paid}
                  onChange={(event) => setPaid(event.target.value)}
                  inputMode="decimal"
                  className="tabular w-32"
                />
                <span className="text-ink-muted">₪</span>
              </span>
            )}
          </Field>
          <span className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPaid(String(receivedValue))}>
              {t('purchases.receive.payAll')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPaid('0')}>
              {t('purchases.receive.payNone')}
            </Button>
          </span>
          <Field label={t('purchases.receive.from')}>
            {(field) => (
              <select
                {...field}
                value={source}
                onChange={(event) => setSource(event.target.value as Source)}
                className="h-10 rounded-lg border border-border bg-surface-100 px-3 text-body"
              >
                {SOURCES.map((item) => (
                  <option key={item} value={item}>
                    {t(`purchases.receive.sources.${item}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {source === 'drawer' && (
            <p className="text-caption text-ink-muted">{t('purchases.receive.drawerNote')}</p>
          )}
        </section>

        <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface-100 shadow-card p-4 text-body">
          <dl className="flex flex-col gap-2">
            {(
              [
                ['orderedValue', orderedValue],
                ['receivedValue', receivedValue],
                ['paidValue', paidValue],
                ['toAccount', Math.max(0, roundMoney(receivedValue - paidValue))],
              ] as const
            ).map(([key, value]) => (
              <div
                key={key}
                className={cn('flex justify-between', key === 'toAccount' && 'font-semibold')}
              >
                <dt className={cn(key !== 'toAccount' && 'text-ink-muted')}>
                  {t(`purchases.receive.${key}`)}
                </dt>
                <dd className="tabular">{formatMoney(value)} ₪</dd>
              </div>
            ))}
          </dl>
          {shorts.length > 0 && (
            <div className="rounded-md bg-warning-soft p-2 text-small text-warning">
              <p className="font-semibold">{t('purchases.receive.remainingOpen')}</p>
              <ul>
                {shorts.map((line) => (
                  <li key={line.productId}>
                    {line.remaining - quantity(line)} {line.unit} <bdi>{line.name}</bdi>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {problem && (
            <p role="alert" className="text-small text-danger">
              {problem}
            </p>
          )}
          <Button size="lg" disabled={receive.isPending} onClick={confirm}>
            {t('purchases.receive.confirm')}
          </Button>
        </section>
      </aside>
    </div>
  )
}
