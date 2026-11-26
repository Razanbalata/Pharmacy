import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { purchaseQueries } from '@/entities/purchase-order'
import {
  PAYMENT_METHODS,
  recordSupplierPayment,
  supplierQueries,
  type PaymentMethod,
  type Supplier,
} from '@/entities/supplier'
import { ApiError } from '@/shared/api'
import { cn } from '@/shared/lib/cn'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { toast } from '@/shared/ui/toast'

interface SupplierPaymentDrawerProps {
  open: boolean
  onClose: () => void
  supplier: Pick<Supplier, 'id' | 'name' | 'balance'>
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Money paid to a supplier: how much, how, and against which invoice.
 * Cash from the drawer is marked, so the shift closing expects less cash.
 */
export function SupplierPaymentDrawer({ open, onClose, supplier }: SupplierPaymentDrawerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(supplier.balance > 0 ? String(supplier.balance) : '')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [fromDrawer, setFromDrawer] = useState(true)
  const [date, setDate] = useState(today())
  const [orderId, setOrderId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | undefined>()
  const { data: invoices = [] } = useQuery({
    ...supplierQueries.openInvoices(supplier.id),
    enabled: open,
  })

  const value = Number(amount)
  const after = Number.isFinite(value) ? roundMoney(supplier.balance - value) : supplier.balance

  const save = useMutation({
    mutationFn: () =>
      recordSupplierPayment(supplier.id, {
        amount: value,
        method,
        fromDrawer: method === 'cash' && fromDrawer,
        date,
        orderId,
        note: note.trim(),
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: supplierQueries.all })
      await queryClient.invalidateQueries({ queryKey: purchaseQueries.all })
      toast.success(
        t('suppliers.payment.saved', { amount: formatMoney(value), receipt: result.receipt }),
      )
      onClose()
    },
    onError: (failure) => {
      const code = failure instanceof ApiError ? failure.fieldErrors.amount?.[0] : undefined
      setError(
        code === 'tooMuch'
          ? t('suppliers.payment.tooMuch')
          : code === 'positive'
            ? t('suppliers.payment.positive')
            : t('validation.serverError'),
      )
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    if (!(value > 0)) setError(t('suppliers.payment.positive'))
    else if (value > supplier.balance + 0.001) setError(t('suppliers.payment.tooMuch'))
    else save.mutate()
  }

  const quick = [supplier.balance, 200, 100].filter(
    (option, index, list) =>
      option > 0 && option <= supplier.balance && list.indexOf(option) === index,
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('suppliers.payment.title')}
      description={t('suppliers.payment.subtitle', {
        name: supplier.name,
        amount: formatMoney(supplier.balance),
      })}
      footer={
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center justify-between text-body">
            <span className="text-ink-muted">{t('suppliers.payment.after')}</span>
            <span className={cn('tabular font-display text-title', after < 0 && 'text-danger')}>
              {formatMoney(Math.max(0, after))} ₪
            </span>
          </div>
          <div className="flex gap-2">
            <Button type="submit" form="supplier-payment" disabled={save.isPending}>
              {t('suppliers.payment.save')}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      }
    >
      <form id="supplier-payment" noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t('suppliers.payment.amount')} error={error}>
          {(field) => (
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2">
                <Input
                  {...field}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  className="tabular w-36 text-title"
                />
                <span className="text-ink-muted">₪</span>
              </span>
              <span className="flex flex-wrap gap-2">
                {quick.map((option, index) => (
                  <Button
                    key={option}
                    size="sm"
                    variant="secondary"
                    onClick={() => setAmount(String(option))}
                  >
                    {index === 0 ? t('suppliers.payment.all') : formatMoney(option)}
                  </Button>
                ))}
              </span>
            </div>
          )}
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-small font-semibold">{t('suppliers.payment.method')}</span>
          <Segmented<PaymentMethod>
            label={t('suppliers.payment.method')}
            value={method}
            onChange={setMethod}
            options={PAYMENT_METHODS.map((item) => ({
              value: item,
              label: t(`suppliers.payment.methods.${item}`),
            }))}
          />
          {method === 'cash' && (
            <label className="flex items-start gap-2 text-body">
              <input
                type="checkbox"
                checked={fromDrawer}
                onChange={(event) => setFromDrawer(event.target.checked)}
                className="mt-1 size-4 accent-brand"
              />
              <span>
                {t('suppliers.payment.fromDrawer')}
                <span className="block text-small text-ink-muted">
                  {t('suppliers.payment.drawerHint')}
                </span>
              </span>
            </label>
          )}
        </div>

        <Field label={t('suppliers.payment.date')}>
          {(field) => (
            <Input
              {...field}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          )}
        </Field>

        <Field label={t('suppliers.payment.invoice')} optional>
          {(field) => (
            <select
              {...field}
              value={orderId ?? ''}
              onChange={(event) =>
                setOrderId(event.target.value ? Number(event.target.value) : null)
              }
              className="h-10 rounded-lg border border-border bg-surface-100 px-3 text-body"
            >
              <option value="">{t('suppliers.payment.general')}</option>
              {invoices.map((invoice) => (
                <option key={invoice.orderId} value={invoice.orderId}>
                  {t('suppliers.payment.remaining', {
                    number: invoice.number,
                    amount: formatMoney(invoice.remaining),
                  })}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={t('suppliers.payment.note')} optional>
          {(field) => (
            <Input {...field} value={note} onChange={(event) => setNote(event.target.value)} />
          )}
        </Field>
      </form>
    </Drawer>
  )
}
