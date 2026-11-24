import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  ACTIVITY_KINDS,
  activityQueries,
  type ActivityFilters,
  type ActivityKind,
  type ActivityPeriod,
} from '@/entities/activity'
import { staffQueries } from '@/entities/staff-member'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { SkeletonRows } from '@/shared/ui/skeleton'

const KIND_STYLE: Record<ActivityKind, { dot: string; badge: string }> = {
  sale: { dot: 'bg-border-strong', badge: 'bg-surface-200 text-ink' },
  sensitive: { dot: 'bg-warning', badge: 'bg-warning-soft text-warning' },
  stock: { dot: 'bg-brand', badge: 'bg-brand-soft text-brand-strong' },
  settings: { dot: 'bg-info', badge: 'bg-info-soft text-info' },
  login: { dot: 'bg-border', badge: 'bg-surface-200 text-ink-muted' },
}

export function ActivityPage() {
  const { t, i18n } = useTranslation()
  const [filters, setFilters] = useState<ActivityFilters>({
    period: 'today',
    actorId: null,
    kind: null,
    sensitiveOnly: false,
    search: '',
  })
  const { data: staff = [] } = useQuery(staffQueries.list())
  const { data: entries = [], isPending, isFetching } = useQuery(activityQueries.list(filters))
  const update = (patch: Partial<ActivityFilters>) =>
    setFilters((current) => ({ ...current, ...patch }))
  const time = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
    ...(filters.period === 'today' ? {} : { day: '2-digit', month: '2-digit' }),
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link to={paths.staff} className="text-small text-brand-strong hover:underline">
          ← {t('activity.back')}
        </Link>
        <h1 className="mt-1 font-display text-display">{t('activity.title')}</h1>
        <p className="mt-1 text-body text-ink-muted">{t('activity.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented<ActivityPeriod>
          label={t('activity.periodLabel')}
          value={filters.period}
          onChange={(period) => update({ period })}
          options={(['today', 'week', 'month'] as const).map((period) => ({
            value: period,
            label: t(`activity.period.${period}`),
          }))}
        />
        <select
          aria-label={t('activity.member')}
          value={filters.actorId ?? ''}
          onChange={(event) =>
            update({ actorId: event.target.value ? Number(event.target.value) : null })
          }
          className="h-9 rounded-md border border-border-strong bg-surface-100 px-2 text-small"
        >
          <option value="">
            {t('activity.member')}: {t('activity.everyone')}
          </option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('activity.kind')}
          value={filters.kind ?? ''}
          onChange={(event) =>
            update({ kind: (event.target.value || null) as ActivityKind | null })
          }
          className="h-9 rounded-md border border-border-strong bg-surface-100 px-2 text-small"
        >
          <option value="">
            {t('activity.kind')}: {t('activity.everyone')}
          </option>
          {ACTIVITY_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {t(`activity.kinds.${kind}`)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-small">
          <input
            type="checkbox"
            checked={filters.sensitiveOnly}
            onChange={(event) => update({ sensitiveOnly: event.target.checked })}
            className="size-4 accent-brand"
          />
          {t('activity.sensitiveOnly')}
        </label>
        <Input
          type="search"
          aria-label={t('activity.search')}
          placeholder={t('activity.search')}
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
          className="h-9 max-w-64 text-small"
        />
      </div>

      <section
        aria-busy={isFetching}
        className={cn(
          'rounded-lg border border-border bg-surface-100',
          isFetching && !isPending && 'opacity-70',
        )}
      >
        {isPending ? (
          <div className="p-4">
            <SkeletonRows rows={6} />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState className="m-4" title={t('activity.empty')} />
        ) : (
          <ol>
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3.5 border-b border-surface-200 px-5 py-3.5 last:border-0"
              >
                <time
                  dateTime={entry.at}
                  className="tabular w-24 shrink-0 pt-0.5 text-small text-ink-muted"
                >
                  {time.format(new Date(entry.at))}
                </time>
                <span
                  aria-hidden
                  className={cn(
                    'mt-1.5 size-2.5 shrink-0 rounded-pill',
                    KIND_STYLE[entry.kind].dot,
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-body">
                    <span className="font-semibold">{entry.actor.name}</span>{' '}
                    {t(`activity.events.${entry.event}`, entry.params)}
                  </p>
                  {entry.detail && <p className="text-small text-ink-muted">{entry.detail}</p>}
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-pill px-2.5 py-0.5 text-caption',
                    KIND_STYLE[entry.kind].badge,
                  )}
                >
                  {t(`activity.kinds.${entry.kind}`)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p className="text-small text-ink-muted">{t('activity.note')}</p>
    </div>
  )
}
