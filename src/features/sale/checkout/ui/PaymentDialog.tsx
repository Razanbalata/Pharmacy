import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cartTotals, useCart } from '@/entities/cart'
import {
  SALE_PAYMENT_METHODS,
  createSale,
  invoiceQueries,
  type Invoice,
  type SalePaymentMethod,
} from '@/entities/invoice'
import { pharmacyQueries } from '@/entities/pharmacy'
import { productQueries } from '@/entities/product'
import { useCurrentUser } from '@/entities/session'
import { shiftQueries } from '@/entities/shift'
import { ApiError } from '@/shared/api'
import { cn } from '@/shared/lib/cn'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { whatsappLink } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  onPaid: (invoice: Invoice) => void
}

/** Exact, then the next round notes a customer is likely to hand over. */
function quickAmounts(total: number): number[] {
  const steps = [
    total,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
  ]
  return steps.filter((amount, index) => amount >= total && steps.indexOf(amount) === index)
}

export function PaymentDialog({ open, onClose, onPaid }: PaymentDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const { data: settings } = useQuery(pharmacyQueries.settings())
  const { lines, discount, customer, clear, label } = useCart()
  const totals = cartTotals(lines, discount)
  const total = totals.total

  const [method, setMethod] = useState<SalePaymentMethod>('cash')
  const [received, setReceived] = useState(String(total))
  const [mixedCash, setMixedCash] = useState('')
  const [mixedBank, setMixedBank] = useState('')
  const [approved, setApproved] = useState(false)
  const [print, setPrint] = useState<boolean | null>(null)
  const [send, setSend] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoPrint = print ?? settings?.print.autoPrint ?? true

  const receivedValue = Number(received) || 0
  const cashPart = Number(mixedCash) || 0
  const bankPart = Number(mixedBank) || 0
  const creditPart =
    method === 'credit'
      ? total
      : method === 'mixed' && customer
        ? roundMoney(total - cashPart - bankPart)
        : 0
  const remaining =
    method === 'mixed' ? roundMoney(total - cashPart - bankPart - Math.max(0, creditPart)) : 0
  const debtAfter = customer ? roundMoney(customer.debt + Math.max(0, creditPart)) : 0
  const over = customer ? roundMoney(debtAfter - customer.debtLimit) : 0
  const isManager = user && 'pharmacy' in user && user.role === 'manager'

  const payment = (() => {
    if (method === 'cash') return { cash: total, bank: 0, credit: 0, received: receivedValue }
    if (method === 'bank') return { cash: 0, bank: total, credit: 0, received: 0 }
    if (method === 'credit') return { cash: 0, bank: 0, credit: total, received: 0 }
    return { cash: cashPart, bank: bankPart, credit: Math.max(0, creditPart), received: cashPart }
  })()

  const blocked =
    (method === 'cash' && receivedValue < total) ||
    ((method === 'credit' || (method === 'mixed' && creditPart > 0)) && !customer) ||
    (method === 'mixed' && (remaining !== 0 || creditPart < 0)) ||
    (over > 0 && Math.max(0, creditPart) > 0 && !approved)

  const pay = useMutation({
    mutationFn: () =>
      createSale({
        lines: lines.map((line) => ({
          productId: line.productId,
          unitIndex: line.unitIndex,
          quantity: line.quantity,
        })),
        discount: totals.discount,
        customerId: customer?.id ?? null,
        payment: { method, ...payment },
        overLimitApproved: approved,
      }),
    onSuccess: async (invoice) => {
      await queryClient.invalidateQueries({ queryKey: productQueries.all })
      await queryClient.invalidateQueries({ queryKey: invoiceQueries.all })
      await queryClient.invalidateQueries({ queryKey: shiftQueries.all })
      clear(label)
      if (send && invoice.customer?.phone) {
        window.open(whatsappLink(invoice.customer.phone, invoice.number), '_blank', 'noopener')
      }
      onPaid(invoice)
      if (autoPrint) window.print()
    },
    onError: (failure) => {
      const errors = failure instanceof ApiError ? failure.fieldErrors : {}
      const codes = Object.entries(errors).map(([field, list]) => `${field}:${list[0]}`)
      setError(
        codes.some((code) => code.endsWith(':stock'))
          ? t('payment.stock')
          : codes.some((code) => code.startsWith('discount:'))
            ? t('payment.discountOver')
            : codes.some((code) => code === 'payment.credit:overLimit')
              ? t('payment.overLimit', { amount: formatMoney(over) })
              : t('payment.failed'),
      )
    },
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('payment.title')}
      description={`${label} · ${t('payment.subtitle', { count: lines.length })}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('payment.back')}
          </Button>
          <Button disabled={blocked || pay.isPending} onClick={() => pay.mutate()}>
            {t('payment.confirm')} ↵
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="flex items-baseline justify-between rounded-md bg-surface-200 px-3 py-2">
          <span>{t('payment.due')}</span>
          <span className="tabular font-display text-display">{formatMoney(total)} ₪</span>
        </p>

        <Segmented<SalePaymentMethod>
          label={t('payment.title')}
          value={method}
          onChange={(next) => {
            setMethod(next)
            setError(null)
          }}
          options={SALE_PAYMENT_METHODS.map((item) => ({
            value: item,
            label: t(`payment.methods.${item}`),
          }))}
        />

        {method === 'cash' && (
          <>
            <Field label={t('payment.received')}>
              {(field) => (
                <Input
                  {...field}
                  value={received}
                  onChange={(event) => setReceived(event.target.value)}
                  inputMode="decimal"
                  className="tabular text-title"
                />
              )}
            </Field>
            <span className="flex flex-wrap gap-2">
              {quickAmounts(total).map((amount, index) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="secondary"
                  onClick={() => setReceived(String(amount))}
                >
                  {index === 0
                    ? `${formatMoney(amount)} ${t('payment.exact')}`
                    : formatMoney(amount)}
                </Button>
              ))}
            </span>
            <p
              className={cn(
                'flex justify-between rounded-md px-3 py-2 font-semibold',
                receivedValue >= total
                  ? 'bg-success-soft text-success'
                  : 'bg-danger-soft text-danger',
              )}
            >
              <span>{receivedValue >= total ? t('payment.change') : t('payment.short')}</span>
              <span className="tabular">
                {formatMoney(Math.abs(roundMoney(receivedValue - total)))} ₪
              </span>
            </p>
          </>
        )}

        {method === 'bank' && <p className="text-small text-ink-muted">{t('payment.bankHint')}</p>}

        {method === 'mixed' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('payment.cash')}>
                {(field) => (
                  <Input
                    {...field}
                    value={mixedCash}
                    onChange={(event) => setMixedCash(event.target.value)}
                    inputMode="decimal"
                    className="tabular"
                  />
                )}
              </Field>
              <Field label={t('payment.bank')}>
                {(field) => (
                  <Input
                    {...field}
                    value={mixedBank}
                    onChange={(event) => setMixedBank(event.target.value)}
                    inputMode="decimal"
                    className="tabular"
                  />
                )}
              </Field>
            </div>
            {customer && creditPart > 0 && (
              <p className="flex justify-between text-small">
                <span>{t('payment.credit')}</span>
                <span className="tabular">{formatMoney(creditPart)} ₪</span>
              </p>
            )}
            <p
              className={cn(
                'text-small font-semibold',
                remaining === 0 ? 'text-success' : 'text-warning',
              )}
            >
              {remaining === 0
                ? t('payment.complete')
                : t('payment.remaining', { amount: formatMoney(remaining) })}
            </p>
          </div>
        )}

        {(method === 'credit' || (method === 'mixed' && creditPart > 0)) &&
          (customer ? (
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              <p className="font-semibold">{customer.name}</p>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {(
                  [
                    ['debtNow', customer.debt],
                    ['debtAfter', debtAfter],
                    ['limit', customer.debtLimit],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key} className="rounded bg-surface-200 p-2">
                    <dt className="text-caption text-ink-muted">{t(`payment.${key}`)}</dt>
                    <dd
                      className={cn(
                        'tabular font-semibold',
                        key === 'debtAfter' && over > 0 && 'text-danger',
                      )}
                    >
                      {formatMoney(value)} ₪
                    </dd>
                  </div>
                ))}
              </dl>
              {over > 0 && (
                <>
                  <p className="text-small text-danger">
                    {t('payment.overLimit', { amount: formatMoney(over) })}
                  </p>
                  {isManager && (
                    <label className="flex items-center gap-2 text-small">
                      <input
                        type="checkbox"
                        checked={approved}
                        onChange={(event) => setApproved(event.target.checked)}
                        className="size-4 accent-brand"
                      />
                      {t('payment.approve')}
                    </label>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
              {t('payment.creditNeedsCustomer')}
            </p>
          ))}

        <div className="flex flex-col gap-1.5 text-small">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(event) => setPrint(event.target.checked)}
              className="size-4 accent-brand"
            />
            {t('payment.autoPrint')}
          </label>
          {customer?.phone && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={send}
                onChange={(event) => setSend(event.target.checked)}
                className="size-4 accent-brand"
              />
              {t('payment.whatsapp')}
            </label>
          )}
        </div>

        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
