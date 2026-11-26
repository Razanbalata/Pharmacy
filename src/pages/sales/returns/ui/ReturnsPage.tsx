import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { findInvoice, invoiceQueries } from '@/entities/invoice'
import { ReturnForm } from '@/features/sale-return/create-return'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Field, Input } from '@/shared/ui/field'
import { PageSkeleton } from '@/shared/ui/skeleton'

/** A return always starts from the invoice it came from. */
export function ReturnsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const id = Number(params.get('invoice'))
  const hasInvoice = Number.isInteger(id) && id > 0
  const [number, setNumber] = useState('')
  const [notFound, setNotFound] = useState(false)
  const { data: invoice, isPending } = useQuery({
    ...invoiceQueries.detail(id),
    enabled: hasInvoice,
  })
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  })

  async function find(event: FormEvent) {
    event.preventDefault()
    setNotFound(false)
    try {
      const found = await findInvoice(number.trim())
      setParams({ invoice: String(found.id) })
    } catch {
      setNotFound(true)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-display">{t('returns.title')}</h1>

      <section
        aria-labelledby="return-invoice"
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-5"
      >
        <h2 id="return-invoice" className="font-display text-body-strong">
          1 · {t('returns.stepInvoice')}
        </h2>
        {hasInvoice && invoice ? (
          <p className="flex flex-wrap items-center justify-between gap-3">
            <span className="tabular">
              <bdi dir="ltr">
                {invoice.number} · {date.format(new Date(invoice.at))}
              </bdi>
              {' · '}
              {t('returns.invoiceLine', {
                customer: invoice.customer?.name ?? t('invoices.walkIn'),
                total: formatMoney(invoice.total),
              })}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setParams({})}>
              {t('returns.change')}
            </Button>
          </p>
        ) : hasInvoice && isPending ? (
          <PageSkeleton variant="form" />
        ) : (
          <form onSubmit={(event) => void find(event)} className="flex flex-wrap items-end gap-2">
            <Field
              label={t('returns.findInvoice')}
              error={notFound ? t('returns.notFound') : undefined}
              className="max-w-xs"
            >
              {(field) => (
                <Input
                  {...field}
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                  placeholder="INV-000241"
                  dir="ltr"
                  className="tabular text-start"
                />
              )}
            </Field>
            <Button type="submit">{t('returns.find')}</Button>
          </form>
        )}
      </section>

      {invoice && (
        <ReturnForm
          key={invoice.id}
          invoice={invoice}
          onDone={() => void navigate(to(paths.invoiceDetail, { id: invoice.id }))}
        />
      )}
    </div>
  )
}
