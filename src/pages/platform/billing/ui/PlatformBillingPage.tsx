import { ExternalLink, Inbox } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  subscriptionQueries,
  type PaymentStatus,
  type SubscriptionPayment,
} from '@/entities/platform/subscription'
import { PaymentReview } from '@/features/platform/review-payment'
import { PlanPriceForm } from '@/features/platform/set-plan-price'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { EmptyState } from '@/shared/ui/empty-state'
import { SkeletonRows } from '@/shared/ui/skeleton'
import { DataTable, type Column } from '@/shared/ui/table'

const STATUS: Record<PaymentStatus, string> = {
  pending: 'bg-warning-soft text-warning',
  confirmed: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
}

/** The plans and their prices, and every payment waiting to be checked or already done. */
export function PlatformBillingPage() {
  const { t, i18n } = useTranslation()
  const { data, isPending } = useQuery(subscriptionQueries.billing())
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })

  const columns: Column<SubscriptionPayment>[] = [
    {
      id: 'date',
      header: t('billing.columns.date'),
      cell: (payment) => <span className="tabular">{date.format(new Date(payment.date))}</span>,
    },
    {
      id: 'pharmacy',
      header: t('billing.columns.pharmacy'),
      cell: (payment) => (
        <Link
          to={to(paths.platformPharmacyDetail, { id: payment.pharmacy.id })}
          className="font-semibold hover:text-platform-accent hover:underline"
        >
          {payment.pharmacy.name}
        </Link>
      ),
    },
    {
      id: 'plan',
      header: t('billing.columns.plan'),
      cell: (payment) => t(`tenants.plans.${payment.plan}`),
    },
    {
      id: 'amount',
      header: t('billing.columns.amount'),
      numeric: true,
      cell: (payment) => (payment.amount === null ? '—' : `${formatMoney(payment.amount)} ₪`),
    },
    { id: 'method', header: t('billing.columns.method'), cell: (payment) => payment.method },
    {
      id: 'receipt',
      header: t('billing.columns.receipt'),
      cell: (payment) =>
        payment.receiptUrl ? (
          <a
            href={payment.receiptUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t('billing.receiptOf', { name: payment.pharmacy.name })}
            className="inline-flex items-center gap-1 text-small font-semibold text-platform-accent hover:underline"
          >
            {t('billing.receipt')}
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        ) : (
          '—'
        ),
    },
    {
      id: 'status',
      header: t('billing.columns.status'),
      cell: (payment) => (
        <span className="flex flex-col items-start gap-0.5">
          <span className={cn('rounded-pill px-2.5 py-0.5 text-caption', STATUS[payment.status])}>
            {t(`billing.statuses.${payment.status}`)}
          </span>
          {payment.rejectionReason && (
            <span className="text-caption text-ink-muted">{payment.rejectionReason}</span>
          )}
        </span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">{t('billing.columns.actions')}</span>,
      cell: (payment) => payment.status === 'pending' && <PaymentReview payment={payment} />,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-display">{t('billing.title')}</h1>
        <p className="mt-1 text-body text-ink-muted">{t('billing.subtitle')}</p>
      </div>

      <section aria-labelledby="billing-plans" className="flex flex-col gap-3">
        <h2 id="billing-plans" className="font-display text-body-strong">
          {t('billing.plans')}
        </h2>
        {isPending || !data ? (
          <SkeletonRows rows={3} />
        ) : (
          <>
            <ul className="grid gap-3 md:grid-cols-3">
              {data.plans.map((plan) => (
                <li
                  key={plan.key}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-title">
                      {t(`tenants.plans.${plan.key}`)}
                    </span>
                    <span className="text-caption text-ink-muted">
                      {t('billing.pharmacies', { count: plan.pharmacies })}
                    </span>
                  </div>
                  <PlanPriceForm plan={plan} />
                  <p className="text-small text-ink-muted">{t(`billing.features.${plan.key}`)}</p>
                </li>
              ))}
            </ul>
            {data.plans.some((plan) => plan.price === null) && (
              <p className="rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
                {t('billing.pricesNote')}
              </p>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="billing-payments" className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h2 id="billing-payments" className="font-display text-body-strong">
            {t('billing.payments')}
          </h2>
          {data && data.pending > 0 && (
            <span className="rounded-pill bg-warning-soft px-2.5 py-0.5 text-caption text-warning">
              {t('billing.pending', { count: data.pending })}
            </span>
          )}
        </div>
        <DataTable
          caption={t('billing.payments')}
          columns={columns}
          rows={data?.payments ?? []}
          getRowId={(payment) => String(payment.id)}
          loading={isPending}
          empty={<EmptyState icon={<Inbox className="size-6" />} title={t('billing.empty')} />}
        />
      </section>
    </div>
  )
}
