import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CUSTOMER_PAYMENT_METHODS,
  customerQueries,
  recordCustomerPayment,
  type CustomerOption,
  type CustomerPaymentMethod,
  type CustomerPaymentResult,
} from '@/entities/customer'
import { useCurrentUser } from '@/entities/session'
import { shiftQueries } from '@/entities/shift'
import { ApiError } from '@/shared/api'
import { cn } from '@/shared/lib/cn'
import { formatMoney, roundMoney } from '@/shared/lib/money'
import { whatsappLink } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { Field, Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { toast } from '@/shared/ui/toast'

interface CustomerPaymentDrawerProps {
  open: boolean
  onClose: () => void
  customer: Pick<CustomerOption, 'id' | 'name' | 'phone' | 'debt'>
}

/**
 * A customer pays off some or all of the debt. Cash goes into the open shift's drawer,
 * so the shift closing expects it. Every payment gets a numbered receipt.
 */
export function CustomerPaymentDrawer({ open, onClose, customer }: CustomerPaymentDrawerProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()
  const [amount, setAmount] = useState(String(customer.debt))
  const [method, setMethod] = useState<CustomerPaymentMethod>('cash')
  const [print, setPrint] = useState(true)
  const [send, setSend] = useState(Boolean(customer.phone))
  const [error, setError] = useState<string | undefined>()
  const [done, setDone] = useState<CustomerPaymentResult | null>(null)
  const pharmacy = user && 'pharmacy' in user ? user.pharmacy.name : ''

  const value = Number(amount)
  const after = Number.isFinite(value) ? roundMoney(customer.debt - value) : customer.debt

  const save = useMutation({
    mutationFn: () => recordCustomerPayment(customer.id, { amount: value, method }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerQueries.all })
      await queryClient.invalidateQueries({ queryKey: shiftQueries.all })
      toast.success(
        t('customerPayment.saved', {
          amount: formatMoney(result.amount),
          receipt: result.receipt,
        }),
      )
      if (send && customer.phone) {
        window.open(
          whatsappLink(
            customer.phone,
            t('customerPayment.whatsappText', {
              name: customer.name,
              amount: formatMoney(result.amount),
              receipt: result.receipt,
              pharmacy,
              balance: formatMoney(result.balance),
            }),
          ),
          '_blank',
          'noopener',
        )
      }
      if (print) {
        setDone(result)
        // The receipt renders first, then prints.
        setTimeout(() => window.print(), 0)
      } else onClose()
    },
    onError: (failure) => {
      const code = failure instanceof ApiError ? failure.fieldErrors.amount?.[0] : undefined
      setError(
        code === 'tooMuch'
          ? t('customerPayment.tooMuch')
          : code === 'positive'
            ? t('customerPayment.positive')
            : t('validation.serverError'),
      )
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    if (!(value > 0)) setError(t('customerPayment.positive'))
    else if (value > customer.debt + 0.001) setError(t('customerPayment.tooMuch'))
    else save.mutate()
  }

  if (done) {
    const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
      numberingSystem: 'latn',
    })
    const rows: [string, string][] = [
      [t('customerPayment.receiptFrom'), customer.name],
      [t('customerPayment.receiptAmount'), `${formatMoney(done.amount)} ₪`],
      [t('customerPayment.receiptMethod'), t(`customerPayment.methods.${method}`)],
      [t('customerPayment.receiptBalance'), `${formatMoney(done.balance)} ₪`],
    ]
    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={t('customerPayment.receiptTitle')}
        footer={
          <>
            <Button onClick={() => window.print()}>{t('receipt.print')}</Button>
            <Button variant="ghost" onClick={onClose}>
              {t('common.close')}
            </Button>
          </>
        }
      >
        <section
          aria-label={t('customerPayment.receiptTitle')}
          className="print-area flex flex-col gap-3 rounded-md border border-border p-4"
        >
          <div className="text-center">
            <p className="font-display text-title">{pharmacy}</p>
            <p className="text-small text-ink-muted">
              {t('customerPayment.receiptTitle')}{' '}
              <bdi dir="ltr" className="tabular">
                {done.receipt}
              </bdi>
            </p>
            <p className="tabular text-caption text-ink-muted">
              <bdi dir="ltr">{date.format(new Date(done.at))}</bdi>
            </p>
          </div>
          <dl className="flex flex-col gap-2">
            {rows.map(([label, text]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="tabular font-semibold">{text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Drawer>
    )
  }

  const quick = [customer.debt, 100, 50].filter(
    (option, index, list) =>
      option > 0 && option <= customer.debt && list.indexOf(option) === index,
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('customerPayment.title')}
      description={t('customerPayment.subtitle', {
        name: customer.name,
        amount: formatMoney(customer.debt),
      })}
      footer={
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center justify-between text-body">
            <span className="text-ink-muted">{t('customerPayment.after')}</span>
            <output className={cn('tabular font-display text-title', after < 0 && 'text-danger')}>
              {formatMoney(Math.max(0, after))} ₪
            </output>
          </div>
          <div className="flex gap-2">
            <Button type="submit" form="customer-payment" disabled={save.isPending}>
              {t('customerPayment.save')}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      }
    >
      <form id="customer-payment" noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t('customerPayment.amount')} error={error}>
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
                    {index === 0
                      ? t('customerPayment.all', { amount: formatMoney(option) })
                      : formatMoney(option)}
                  </Button>
                ))}
              </span>
            </div>
          )}
        </Field>

        <div className="flex flex-col items-start gap-2">
          <span className="text-small font-semibold">{t('customerPayment.method')}</span>
          <Segmented<CustomerPaymentMethod>
            label={t('customerPayment.method')}
            value={method}
            onChange={setMethod}
            options={CUSTOMER_PAYMENT_METHODS.map((item) => ({
              value: item,
              label: t(`customerPayment.methods.${item}`),
            }))}
          />
        </div>

        <label className="flex items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={print}
            onChange={(event) => setPrint(event.target.checked)}
            className="size-4 accent-brand"
          />
          {t('customerPayment.print')}
        </label>
        {customer.phone && (
          <label className="flex items-start gap-2 text-body">
            <input
              type="checkbox"
              checked={send}
              onChange={(event) => setSend(event.target.checked)}
              className="mt-1 size-4 accent-brand"
            />
            {t('customerPayment.whatsapp')}
          </label>
        )}
      </form>
    </Drawer>
  )
}
