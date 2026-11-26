import { SearchX } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import {
  endsText,
  lastActiveText,
  PlanBadge,
  platformPharmacyQueries,
  type SubscriptionEvent,
} from '@/entities/platform/pharmacy'
import { PharmacyActions } from '@/features/platform/manage-pharmacy'
import { paths } from '@/shared/config'
import { formatPhone, whatsappLink } from '@/shared/lib/validation'
import { Button, buttonVariants } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { PageSkeleton } from '@/shared/ui/skeleton'

type Open = 'extend' | 'plan' | 'support' | 'suspend' | 'resume' | null

/**
 * One pharmacy for the platform owner: who it is, how it is used (counts only), what can be
 * done, and its subscription history.
 */
export function PlatformPharmacyPage() {
  const { t, i18n } = useTranslation()
  const id = Number(useParams().id)
  const [open, setOpen] = useState<Open>(null)
  const { data, isPending, isError } = useQuery({
    ...platformPharmacyQueries.detail(id),
    enabled: Number.isInteger(id),
  })
  const [now] = useState(() => Date.now())
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })

  if (isError || !Number.isInteger(id)) {
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('tenant.notFound')}
        actions={
          <Link to={paths.platformPharmacies} className={buttonVariants({ variant: 'secondary' })}>
            {t('tenant.back')}
          </Link>
        }
      />
    )
  }
  if (isPending) return <PageSkeleton variant="detail" />

  const ends = endsText(data, t, date)
  const event = (item: SubscriptionEvent) => {
    const plan = 'plan' in item.params ? t(`tenants.plans.${item.params.plan}`) : ''
    const until = 'until' in item.params ? date.format(new Date(item.params.until)) : ''
    if (item.kind === 'ends') {
      return item.params.plan === 'trial'
        ? t('tenant.events.endsTrial')
        : t('tenant.events.endsPlan', { plan })
    }
    return t(`tenant.events.${item.kind}`, { ...item.params, plan, until })
  }

  const facts: [string, string, boolean][] = [
    [t('tenant.owner'), data.owner, false],
    [t('tenant.phone'), formatPhone(data.phone), true],
    [t('tenant.city'), `${data.city} · ${data.district}`, false],
    [t('tenant.license'), data.license, true],
    // Dates carry their own direction marks; isolating them left to right scrambles them.
    [t('tenant.registered'), date.format(new Date(data.registeredAt)), false],
  ]
  const usage: [string, string][] = [
    [t('tenant.products'), String(data.products)],
    [t('tenant.staff'), t('tenant.staffValue', data.staff)],
    [t('tenant.invoicesToday'), String(data.invoicesToday)],
    [t('tenant.lastLogin'), lastActiveText(data.lastActiveAt, t, now)],
    [
      t('tenant.onboarding'),
      data.onboardingDone ? t('tenant.onboardingDone') : t('tenant.onboardingOpen'),
    ],
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to={paths.platformPharmacies}
            className="text-small text-platform-accent hover:underline"
          >
            ← {t('tenant.back')}
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-display">
            {data.name}
            <PlanBadge pharmacy={data} />
          </h1>
          <p className="mt-1 text-body text-ink-muted">{ends.text}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappLink(
              data.phone,
              t('tenant.whatsappText', { name: data.owner, pharmacy: data.name }),
            )}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: 'secondary' })}
          >
            {t('tenant.whatsapp')}
          </a>
          <Button onClick={() => setOpen('plan')}>{t('tenant.activate')}</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section
          aria-labelledby="tenant-details"
          className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
        >
          <h2 id="tenant-details" className="font-display text-body-strong">
            {t('tenant.details')}
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-small">
            {facts.map(([label, value, ltr]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-semibold">{ltr ? <bdi dir="ltr">{value}</bdi> : value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section
          aria-labelledby="tenant-usage"
          className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
        >
          <h2 id="tenant-usage" className="font-display text-body-strong">
            {t('tenant.usage')}
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-small">
            {usage.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="tabular font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 rounded-md bg-surface-200/60 px-3 py-2 text-caption text-ink-muted">
            {t('tenant.usageNote')}
          </p>
        </section>
        <section
          aria-labelledby="tenant-actions"
          className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
        >
          <h2 id="tenant-actions" className="font-display text-body-strong">
            {t('tenant.actions')}
          </h2>
          <div className="mt-2">
            <PharmacyActions pharmacy={data} open={open} onOpen={setOpen} />
          </div>
        </section>
      </div>

      <section
        aria-labelledby="tenant-history"
        className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
      >
        <h2 id="tenant-history" className="font-display text-body-strong">
          {t('tenant.history')}
        </h2>
        <ol className="mt-3 flex flex-col gap-3 border-s-2 border-border ps-4">
          {data.history.map((item, index) => (
            // History lines have no id; they are only ever added to the end.
            // oxlint-disable-next-line react/no-array-index-key
            <li key={`${item.kind}-${index}`} className="flex flex-col gap-0.5 text-small">
              <span className="tabular text-caption text-ink-muted">
                {date.format(new Date(item.at))}
              </span>
              <span>{event(item)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
