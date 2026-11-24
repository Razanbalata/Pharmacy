import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  joinRequestQueries,
  type JoinRequest,
  type JoinRequestStatus,
} from '@/entities/join-request'
import { AddPharmacyDrawer, ReviewActions } from '@/features/platform/review-join-request'
import { cn } from '@/shared/lib/cn'
import { formatPhone } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { SkeletonRows } from '@/shared/ui/skeleton'

const FILTERS: JoinRequestStatus[] = ['new', 'approved', 'activated', 'rejected']

const STATUS_TONE: Record<JoinRequestStatus, string> = {
  new: 'bg-platform-soft text-platform-accent',
  approved: 'bg-warning-soft text-warning',
  activated: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
}

function formatDate(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    numberingSystem: 'latn',
  }).format(new Date(iso))
}

function Details({ request }: { request: JoinRequest }) {
  const { t, i18n } = useTranslation()
  // Numbers keep left-to-right order inside Arabic text; names keep their own direction.
  const rows: [string, string, boolean][] = [
    [t('platform.requests.owner'), request.ownerName, false],
    [t('platform.requests.phone'), formatPhone(request.phone), true],
    [t('platform.requests.city'), request.city, false],
    [t('platform.requests.license'), request.licenseNumber, true],
    [t('platform.requests.received'), formatDate(request.createdAt, i18n.language), false],
  ]
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-subheading">{request.pharmacyName}</h2>
        <span className="tabular text-caption text-ink-muted">{request.reference}</span>
      </div>
      <dl className="flex flex-col">
        {rows.map(([label, value, ltr]) => (
          <div
            key={label}
            className="flex justify-between gap-4 border-t border-surface-200 py-2 text-body"
          >
            <dt className="text-ink-muted">{label}</dt>
            <dd className="tabular">
              <bdi {...(ltr ? { dir: 'ltr' } : {})}>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex h-28 items-center justify-center rounded-md border border-border bg-surface-200 text-small text-ink-muted">
        {request.hasLicensePhoto
          ? t('platform.requests.licensePhoto')
          : t('platform.requests.withoutPhoto')}
      </div>
      {request.status === 'rejected' && request.rejectionReason && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-small text-danger">
          {request.rejectionReason}
        </p>
      )}
      {request.status === 'new' && (
        <p className="rounded-md bg-info-soft px-3 py-2 text-small text-info">
          {t('platform.requests.checkFirst')}
        </p>
      )}
      <ReviewActions request={request} />
    </section>
  )
}

/** The platform owner decides who joins. Nothing gets in without her approval. */
export function PlatformRequestsPage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<JoinRequestStatus>('new')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const all = useQuery(joinRequestQueries.list('all'))
  const list = (all.data ?? []).filter((request) => request.status === filter)
  const selected = list.find((request) => request.id === selectedId) ?? list[0] ?? null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('platform.requests.title')}</h1>
          <p className="mt-1 max-w-2xl text-body text-ink-muted">
            {t('platform.requests.subtitle')}
          </p>
        </div>
        <Button
          className="bg-platform-accent hover:bg-platform-accent/90"
          onClick={() => setAdding(true)}
        >
          {t('platform.requests.addManually')}
        </Button>
      </div>

      <div
        role="tablist"
        aria-label={t('platform.requests.title')}
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map((status) => {
          const count = (all.data ?? []).filter((request) => request.status === status).length
          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={filter === status}
              onClick={() => {
                setFilter(status)
                setSelectedId(null)
              }}
              className={cn(
                'rounded-pill border px-3.5 py-1.5 text-small',
                filter === status
                  ? 'border-platform bg-platform text-white'
                  : 'border-border bg-surface-100',
              )}
            >
              {t(`platform.requests.filters.${status}`)} · <span className="tabular">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-100">
          {all.isPending && (
            <div className="p-4">
              <SkeletonRows rows={5} />
            </div>
          )}
          {!all.isPending && list.length === 0 && (
            <EmptyState className="m-4" title={t('platform.requests.empty')} />
          )}
          <ul>
            {list.map((request) => (
              <li key={request.id}>
                <button
                  type="button"
                  aria-current={selected?.id === request.id ? 'true' : undefined}
                  onClick={() => setSelectedId(request.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-surface-200 border-s-3 px-4 py-3.5 text-start',
                    selected?.id === request.id
                      ? 'border-s-platform-accent bg-platform-soft/50'
                      : 'border-s-transparent hover:bg-surface-200/60',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-strong">{request.pharmacyName}</span>
                    <span className="block text-small text-ink-muted">
                      {request.ownerName} · {request.city} ·{' '}
                      <bdi dir="ltr" className="tabular">
                        {formatPhone(request.phone)}
                      </bdi>
                    </span>
                  </span>
                  <span
                    className={cn(
                      'rounded-pill px-2.5 py-0.5 text-caption',
                      STATUS_TONE[request.status],
                    )}
                  >
                    {t(`platform.requests.statusLabels.${request.status}`)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selected ? (
          <Details request={selected} />
        ) : (
          !all.isPending && <EmptyState title={t('platform.requests.pick')} />
        )}
      </div>

      <AddPharmacyDrawer open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
