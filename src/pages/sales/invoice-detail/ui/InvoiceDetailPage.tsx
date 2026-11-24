import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { InvoiceStatusBadge, PaymentMethodBadge, invoiceQueries } from '@/entities/invoice'
import { pharmacyQueries } from '@/entities/pharmacy'
import { ReceiptDialog } from '@/features/sale/checkout'
import { paths } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { whatsappLink } from '@/shared/lib/validation'
import { Button, buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { PageSkeleton } from '@/shared/ui/skeleton'

export function InvoiceDetailPage() {
  const { t, i18n } = useTranslation()
  const id = Number(useParams().id)
  const [reprint, setReprint] = useState(false)
  const {
    data: invoice,
    isPending,
    isError,
  } = useQuery({
    ...invoiceQueries.detail(id),
    enabled: Number.isInteger(id),
  })
  const { data: profile } = useQuery(pharmacyQueries.profile())
  const locale = i18n.language === 'ar' ? 'ar-PS' : 'en-GB'
  const dateTime = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  })

  if (isError || !Number.isInteger(id)) {
    return (
      <EmptyState
        icon="?"
        title={t('invoiceDetail.notFound')}
        actions={
          <Link to={paths.invoices} className={buttonVariants({ variant: 'secondary' })}>
            {t('invoiceDetail.back')}
          </Link>
        }
      />
    )
  }
  if (isPending) return <PageSkeleton variant="detail" />

  const action = buttonVariants({ variant: 'secondary', size: 'sm' })
  const card = 'rounded-lg border border-border bg-surface-100 p-4'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={paths.invoices} className="text-small text-brand-strong hover:underline">
            ← {t('invoiceDetail.back')}
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="tabular font-display text-display">{invoice.number}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-body text-ink-muted">
            {t('invoiceDetail.meta', {
              date: dateTime.format(new Date(invoice.at)),
              shift: invoice.shiftNumber,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setReprint(true)}>
            {t('invoiceDetail.reprint')}
          </Button>
          {invoice.customer?.phone && (
            <a
              href={whatsappLink(
                invoice.customer.phone,
                t('receipt.whatsappText', {
                  pharmacy: profile?.name ?? '',
                  number: invoice.number,
                  amount: formatMoney(invoice.total),
                }),
              )}
              target="_blank"
              rel="noreferrer"
              className={action}
            >
              {t('invoiceDetail.whatsapp')}
            </a>
          )}
          {invoice.status !== 'returned' && (
            <Link
              to={`${paths.returns}?invoice=${invoice.id}`}
              className={buttonVariants({ size: 'sm' })}
            >
              {t('invoiceDetail.return')}
            </Link>
          )}
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={card}>
          <dt className="text-small text-ink-muted">{t('invoiceDetail.customer')}</dt>
          <dd className="mt-1 font-semibold">{invoice.customer?.name ?? t('invoices.walkIn')}</dd>
        </div>
        <div className={card}>
          <dt className="text-small text-ink-muted">{t('invoiceDetail.cashier')}</dt>
          <dd className="mt-1 font-semibold">{invoice.cashier}</dd>
        </div>
        <div className={card}>
          <dt className="text-small text-ink-muted">{t('invoiceDetail.payment')}</dt>
          <dd className="mt-1 flex flex-col items-start gap-1">
            <PaymentMethodBadge method={invoice.payment.method} />
            {invoice.payment.method === 'mixed' && (
              <span className="tabular text-caption text-ink-muted">
                {t('invoiceDetail.split', {
                  cash: formatMoney(invoice.payment.cash),
                  bank: formatMoney(invoice.payment.bank),
                  credit: formatMoney(invoice.payment.credit),
                })}
              </span>
            )}
          </dd>
        </div>
        <div className={card}>
          <dt className="text-small text-ink-muted">{t('invoiceDetail.profit')}</dt>
          <dd className="tabular mt-1 font-semibold text-success">
            {invoice.profit === null
              ? t('invoiceDetail.hidden')
              : `${formatMoney(invoice.profit)} ₪`}
          </dd>
        </div>
      </dl>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <caption className="sr-only">{invoice.number}</caption>
              <thead>
                <tr className="border-b border-border text-small text-ink-muted">
                  {(['product', 'batch', 'unit', 'quantity', 'price', 'total'] as const).map(
                    (column) => (
                      <th
                        key={column}
                        className={`px-2 py-2 font-semibold ${['quantity', 'price', 'total'].includes(column) ? 'text-end' : 'text-start'}`}
                      >
                        {t(`invoiceDetail.columns.${column}`)}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr
                    key={`${line.productId}-${line.unit}`}
                    className="border-b border-border last:border-0"
                  >
                    <th scope="row" className="px-2 py-2.5 text-start font-normal">
                      <bdi className="block font-semibold">{line.name}</bdi>
                      {line.returned > 0 && (
                        <span className="text-caption text-warning">
                          {t('invoiceDetail.returned', { count: line.returned })}
                        </span>
                      )}
                    </th>
                    <td className="px-2 py-2.5">
                      <bdi dir="ltr" className="tabular text-ink-muted">
                        {line.batch}
                      </bdi>
                    </td>
                    <td className="px-2 py-2.5">{line.unit}</td>
                    <td className="tabular px-2 py-2.5 text-end">{line.quantity}</td>
                    <td className="tabular px-2 py-2.5 text-end">{formatMoney(line.price)}</td>
                    <td className="tabular px-2 py-2.5 text-end">{formatMoney(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ms-auto flex w-full max-w-xs flex-col gap-1 text-body">
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t('invoiceDetail.subtotal')}</dt>
              <dd className="tabular">{formatMoney(invoice.subtotal)} ₪</dd>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>{t('invoiceDetail.discount')}</dt>
                <dd className="tabular">
                  <bdi dir="ltr">− {formatMoney(invoice.discount)} ₪</bdi>
                </dd>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <dt>{t('invoiceDetail.total')}</dt>
              <dd className="tabular font-display text-title">{formatMoney(invoice.total)} ₪</dd>
            </div>
            {invoice.payment.cash > 0 && (
              <div className="flex justify-between text-small text-ink-muted">
                <dt>{t('invoiceDetail.receivedChange')}</dt>
                <dd className="tabular">
                  {formatMoney(invoice.payment.received)} · {formatMoney(invoice.payment.change)} ₪
                </dd>
              </div>
            )}
          </dl>
          <p className="text-caption text-ink-muted">{t('invoiceDetail.locked')}</p>
        </section>

        <section className="rounded-lg border border-border bg-surface-100 p-4">
          <h2 className="font-display text-body-strong">{t('invoiceDetail.log')}</h2>
          <ol className="mt-2 flex flex-col gap-2 text-small">
            {invoice.log.map((entry) => (
              <li key={`${entry.at}-${entry.text}`} className="flex flex-col">
                <span className="tabular text-caption text-ink-muted">
                  {dateTime.format(new Date(entry.at))}
                </span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ReceiptDialog invoice={reprint ? invoice : null} onClose={() => setReprint(false)} />
    </div>
  )
}
