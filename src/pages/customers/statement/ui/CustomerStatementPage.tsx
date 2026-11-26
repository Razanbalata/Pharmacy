import { SearchX } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import {
  CUSTOMER_STATEMENT_PERIODS,
  customerQueries,
  type CustomerStatementLine,
  type CustomerStatementPeriod,
} from '@/entities/customer'
import { useCurrentUser } from '@/entities/session'
import { CustomerFormDrawer } from '@/features/customer/manage'
import { CustomerPaymentDrawer } from '@/features/customer/record-payment'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMonthYear } from '@/shared/lib/date'
import { formatMoney } from '@/shared/lib/money'
import { formatPhone, whatsappLink } from '@/shared/lib/validation'
import { Button, buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Segmented } from '@/shared/ui/segmented'
import { PageSkeleton } from '@/shared/ui/skeleton'

const th = 'px-4 py-3 text-start text-small font-semibold text-ink-muted whitespace-nowrap'
const td = 'px-4 py-3 align-top'

/** One customer's account: every credit sale, payment and refund, with the running balance. */
export function CustomerStatementPage() {
  const { t, i18n } = useTranslation()
  const id = Number(useParams().id)
  const [period, setPeriod] = useState<CustomerStatementPeriod>('month')
  const [open, setOpen] = useState<'edit' | 'pay' | null>(null)
  const { data: user } = useCurrentUser()
  const { data, isPending, isError } = useQuery({
    ...customerQueries.statement(id, period),
    enabled: Number.isInteger(id),
  })
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })

  if (isError || !Number.isInteger(id)) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('customerStatement.notFound')}
        actions={
          <Link to={paths.customers} className={buttonVariants({ variant: 'secondary' })}>
            {t('customerStatement.back')}
          </Link>
        }
      />
    )
  }
  if (isPending) return <PageSkeleton variant="detail" />

  const { customer } = data
  const pharmacy = user && 'pharmacy' in user ? user.pharmacy.name : ''
  const canEdit = user?.role === 'manager' || user?.role === 'pharmacist'
  const money = (value: number) => (value ? formatMoney(value) : '')
  const over = customer.creditAllowed && customer.debt > customer.debtLimit

  const what = (line: CustomerStatementLine) => {
    const title =
      line.kind === 'opening'
        ? t('customerStatement.kinds.opening')
        : line.kind === 'payment'
          ? t('customerStatement.kinds.payment', {
              method: line.method ? t(`customerStatement.methods.${line.method}`) : '',
            })
          : t(`customerStatement.kinds.${line.kind}`, { number: line.reference })
    const sub = [
      line.kind === 'payment' && t('customerStatement.receipt', { number: line.reference }),
      line.items && t('customerStatement.items', { count: line.items }),
      line.actor,
    ]
      .filter(Boolean)
      .join(' · ')
    return (
      <>
        {line.invoiceId ? (
          <Link
            to={to(paths.invoiceDetail, { id: line.invoiceId })}
            className="font-semibold text-brand-strong hover:underline"
          >
            {title}
          </Link>
        ) : (
          <span className="font-semibold">{title}</span>
        )}
        <span className="block text-caption text-ink-muted">{sub}</span>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={paths.customers} className="text-small text-brand-strong hover:underline">
            ← {t('customerStatement.back')}
          </Link>
          <h1 className="mt-1 font-display text-display">{customer.name}</h1>
          <p className="mt-1 text-body text-ink-muted">
            {customer.phone && (
              <>
                <bdi dir="ltr" className="tabular">
                  {formatPhone(customer.phone)}
                </bdi>
                {' · '}
              </>
            )}
            {t('customerStatement.since', { date: formatMonthYear(customer.since) })}
            {' · '}
            {customer.creditAllowed
              ? t('customerStatement.credit')
              : t('customerStatement.noCredit')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {customer.phone && (
            <a
              href={whatsappLink(
                customer.phone,
                t('customerStatement.whatsappText', {
                  pharmacy,
                  name: customer.name,
                  amount: formatMoney(customer.debt),
                }),
              )}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              {t('customerStatement.sendWhatsapp')}
            </a>
          )}
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            {t('customerStatement.print')}
          </Button>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={() => setOpen('edit')}>
              {t('customerStatement.edit')}
            </Button>
          )}
          {customer.debt > 0 && (
            <Button size="sm" onClick={() => setOpen('pay')}>
              {t('customerStatement.pay')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div
          className={cn(
            'rounded-lg border p-4',
            over ? 'border-danger bg-danger-soft' : 'border-warning bg-warning-soft',
          )}
        >
          <p className={cn('text-small', over ? 'text-danger' : 'text-warning')}>
            {t('customerStatement.owes')}
          </p>
          <p className="tabular mt-1 font-display text-title">{formatMoney(customer.debt)} ₪</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
          <p className="text-small text-ink-muted">{t('customerStatement.limit')}</p>
          <p className="tabular mt-1 font-display text-title">
            {customer.creditAllowed ? `${formatMoney(customer.debtLimit)} ₪` : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
          <p className="text-small text-ink-muted">{t('customerStatement.thisMonth')}</p>
          <p className="tabular mt-1 font-display text-title">
            {formatMoney(data.purchasesThisMonth)} ₪
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-small text-ink-muted">{t('customerStatement.period')}</span>
            <Segmented<CustomerStatementPeriod>
              label={t('customerStatement.period')}
              value={period}
              onChange={setPeriod}
              options={CUSTOMER_STATEMENT_PERIODS.map((value) => ({
                value,
                label: t(`customerStatement.periods.${value}`),
              }))}
            />
          </div>

          <div className="print-area overflow-x-auto rounded-lg border border-border bg-surface-100 shadow-card">
            <table className="w-full border-collapse text-body">
              <caption className="sr-only">{customer.name}</caption>
              <thead>
                <tr className="border-b border-border">
                  <th className={th}>{t('customerStatement.columns.date')}</th>
                  <th className={th}>{t('customerStatement.columns.what')}</th>
                  <th className={`${th} text-end`}>{t('customerStatement.columns.debit')}</th>
                  <th className={`${th} text-end`}>{t('customerStatement.columns.credit')}</th>
                  <th className={`${th} text-end`}>{t('customerStatement.columns.balance')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border bg-surface-200/60">
                  <td className={`${td} tabular`}>{date.format(new Date(data.from))}</td>
                  <td className={td} colSpan={3}>
                    {t('customerStatement.opening')}
                  </td>
                  <td className={`${td} tabular text-end font-semibold`}>
                    {formatMoney(data.openingBalance)}
                  </td>
                </tr>
                {data.lines.map((line) => (
                  <tr key={line.id} className="border-b border-border last:border-0">
                    <td className={`${td} tabular`}>{date.format(new Date(line.at))}</td>
                    <td className={td}>{what(line)}</td>
                    <td className={`${td} tabular text-end`}>{money(line.debit)}</td>
                    <td className={`${td} tabular text-end text-success`}>{money(line.credit)}</td>
                    <td className={`${td} tabular text-end font-semibold`}>
                      {formatMoney(line.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.lines.length === 0 && (
              <p className="p-4 text-center text-small text-ink-muted">
                {t('customerStatement.empty')}
              </p>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          {data.recent.length > 0 && (
            <section
              aria-labelledby="customer-recent"
              className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
            >
              <h2 id="customer-recent" className="font-display text-body-strong">
                {t('customerStatement.recent')}
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {data.recent.map((item) => (
                  <li key={item.productId} className="flex flex-col gap-0.5">
                    <Link
                      to={to(paths.productDetail, { id: item.productId })}
                      className="font-semibold hover:text-brand-strong hover:underline"
                    >
                      <bdi>{item.name}</bdi>
                    </Link>
                    <span className="text-caption text-ink-muted">
                      {t('customerStatement.lastBought', {
                        date: date.format(new Date(item.lastBought)),
                      })}
                    </span>
                    {customer.phone && (
                      <a
                        href={whatsappLink(
                          customer.phone,
                          t('customerStatement.remindProductText', {
                            name: customer.name,
                            pharmacy,
                            product: item.name,
                            date: date.format(new Date(item.lastBought)),
                          }),
                        )}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${t('customerStatement.remindProduct')}: ${item.name}`}
                        className="text-small text-success hover:underline"
                      >
                        {t('customerStatement.remindProduct')}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {customer.notes && (
            <section
              aria-labelledby="customer-notes"
              className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
            >
              <h2 id="customer-notes" className="font-display text-body-strong">
                {t('customerStatement.notes')}
              </h2>
              <p className="mt-2 text-body">{customer.notes}</p>
            </section>
          )}
        </aside>
      </div>

      {open === 'edit' && (
        <CustomerFormDrawer open customer={customer} onClose={() => setOpen(null)} />
      )}
      {open === 'pay' && (
        <CustomerPaymentDrawer open customer={customer} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}
