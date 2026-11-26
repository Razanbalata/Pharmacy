import { Inbox } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  endsText,
  lastActiveText,
  PHARMACY_FILTERS,
  platformPharmacyQueries,
  PlanBadge,
  type PharmacyFilter,
  type PlatformPharmacy,
} from '@/entities/platform/pharmacy'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatPhone } from '@/shared/lib/validation'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { DataTable, type Column } from '@/shared/ui/table'

function Stat({ label, value, tone }: { label: string; value: number; tone?: string | undefined }) {
  return (
    <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
      <p className="text-small text-ink-muted">{label}</p>
      <p className={cn('tabular mt-1 font-display text-title', tone)}>{value}</p>
    </div>
  )
}

/** Every pharmacy on the platform: its plan, when it ends, and how much it is used. */
export function PlatformPharmaciesPage() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<PharmacyFilter>('all')
  const [city, setCity] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const deferred = useDeferredValue(search.trim())
  const { data, isPending } = useQuery(
    platformPharmacyQueries.list({ filter, city, search: deferred }),
  )
  const [now] = useState(() => Date.now())
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })

  const columns: Column<PlatformPharmacy>[] = [
    {
      id: 'pharmacy',
      header: t('tenants.columns.pharmacy'),
      cell: (item) => (
        <Link
          to={to(paths.platformPharmacyDetail, { id: item.id })}
          className="font-semibold hover:text-platform-accent hover:underline"
        >
          {item.name}
        </Link>
      ),
    },
    {
      id: 'owner',
      header: t('tenants.columns.owner'),
      cell: (item) => (
        <span className="flex flex-col">
          <span>{item.owner}</span>
          <bdi dir="ltr" className="tabular text-start text-caption text-ink-muted">
            {formatPhone(item.phone)}
          </bdi>
        </span>
      ),
    },
    { id: 'city', header: t('tenants.columns.city'), cell: (item) => item.city },
    {
      id: 'plan',
      header: t('tenants.columns.plan'),
      cell: (item) => <PlanBadge pharmacy={item} />,
    },
    {
      id: 'ends',
      header: t('tenants.columns.ends'),
      cell: (item) => {
        const { text, soon } = endsText(item, t, date)
        return <span className={cn('tabular', soon && 'font-semibold text-warning')}>{text}</span>
      },
    },
    {
      id: 'products',
      header: t('tenants.columns.products'),
      numeric: true,
      cell: (item) => item.products,
    },
    {
      id: 'staff',
      header: t('tenants.columns.staff'),
      numeric: true,
      cell: (item) => item.staff.total,
    },
    {
      id: 'last',
      header: t('tenants.columns.last'),
      cell: (item) => (
        <span className="text-small text-ink-muted">
          {lastActiveText(item.lastActiveAt, t, now)}
        </span>
      ),
    },
  ]

  const summary = data?.summary
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-display">{t('tenants.title')}</h1>
        <p className="mt-1 text-body text-ink-muted">{t('tenants.subtitle')}</p>
      </div>
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label={t('tenants.paid')} value={summary.paid} />
          <Stat label={t('tenants.trial')} value={summary.trial} />
          <Stat
            label={t('tenants.endingThisWeek')}
            value={summary.endingThisWeek}
            tone={summary.endingThisWeek > 0 ? 'text-warning' : undefined}
          />
          <Stat
            label={t('tenants.suspended')}
            value={summary.suspended}
            tone={summary.suspended > 0 ? 'text-danger' : undefined}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {summary && (
          <Segmented<PharmacyFilter>
            label={t('tenants.filter')}
            value={filter}
            onChange={setFilter}
            options={PHARMACY_FILTERS.map((value) => ({
              value,
              label: `${t(`tenants.filters.${value}`)} · ${summary.counts[value]}`,
            }))}
          />
        )}
        <select
          aria-label={t('tenants.city')}
          value={city ?? ''}
          onChange={(event) => setCity(event.target.value || null)}
          className="h-9 rounded-lg border border-border bg-surface-100 px-3 text-body"
        >
          <option value="">{t('tenants.allCities')}</option>
          {summary?.cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('tenants.search')}
          aria-label={t('tenants.search')}
          className="h-9 w-64"
        />
      </div>
      <DataTable
        caption={t('tenants.title')}
        columns={columns}
        rows={data?.data ?? []}
        getRowId={(item) => String(item.id)}
        loading={isPending}
        empty={<EmptyState icon={<Inbox className="size-6" />} title={t('tenants.empty')} />}
      />
    </div>
  )
}
