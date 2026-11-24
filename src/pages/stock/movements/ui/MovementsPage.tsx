import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { MOVEMENT_KINDS, type MovementKind } from '@/entities/product'
import { staffQueries } from '@/entities/staff-member'
import {
  MOVEMENT_PERIODS,
  movementQueries,
  type MovementEntry,
  type MovementFilters,
  type MovementPeriod,
} from '@/entities/stock-movement'
import { StockTabs } from '@/widgets/stock-tabs'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { DataTable, type Column } from '@/shared/ui/table'

const KIND_TONE = {
  sale: 'neutral',
  purchase: 'success',
  return: 'info',
  damage: 'danger',
  count: 'warning',
  opening: 'neutral',
  import: 'brand',
} as const

const selectClass = 'h-9 rounded-md border border-border-strong bg-surface-100 px-2 text-small'

function useWhen() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ar' ? 'ar-PS' : 'en-GB'
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  })
  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })
  return (iso: string, today: string, yesterday: string) => {
    const date = new Date(iso)
    const day = iso.slice(0, 10)
    if (day === today) return t('movements.today', { time: time.format(date) })
    if (day === yesterday) return t('movements.yesterday', { time: time.format(date) })
    return `${dayMonth.format(date)} ${time.format(date)}`
  }
}

export function MovementsPage() {
  const { t } = useTranslation()
  const when = useWhen()
  const [days] = useState(() => {
    const now = Date.now()
    return {
      today: new Date(now).toISOString().slice(0, 10),
      yesterday: new Date(now - 86_400_000).toISOString().slice(0, 10),
    }
  })
  const [filters, setFilters] = useState<MovementFilters>({ actorId: null, days: 30, kind: null })
  const { data, isPending } = useQuery(movementQueries.list(filters))
  const { data: staff = [] } = useQuery(staffQueries.list())
  const update = (patch: Partial<MovementFilters>) =>
    setFilters((current) => ({ ...current, ...patch }))

  const reference = (entry: MovementEntry) => {
    if (entry.link?.type === 'order') {
      return (
        <Link
          to={to(paths.purchaseDetail, { id: entry.link.id })}
          className="tabular text-brand-strong hover:underline"
        >
          {entry.reference}
        </Link>
      )
    }
    if (entry.link?.type === 'damage') {
      return (
        <Link to={paths.stockDamage} className="text-brand-strong hover:underline">
          {t('movements.damageRef')}
        </Link>
      )
    }
    return entry.reference ? (
      <bdi dir="ltr" className="tabular">
        {entry.reference}
      </bdi>
    ) : (
      '—'
    )
  }

  const columns: Column<MovementEntry>[] = [
    {
      id: 'time',
      header: t('movements.columns.time'),
      cell: (entry) => (
        <span className="tabular whitespace-nowrap">
          {when(entry.at, days.today, days.yesterday)}
        </span>
      ),
    },
    {
      id: 'product',
      header: t('movements.columns.product'),
      cell: (entry) => (
        <Link
          to={to(paths.productDetail, { id: entry.product.id })}
          className="font-semibold hover:text-brand-strong hover:underline"
        >
          <bdi>{entry.product.name}</bdi>
        </Link>
      ),
    },
    {
      id: 'batch',
      header: t('movements.columns.batch'),
      cell: (entry) =>
        entry.batch ? (
          <bdi dir="ltr" className="tabular text-ink-muted">
            {entry.batch}
          </bdi>
        ) : (
          '—'
        ),
    },
    {
      id: 'kind',
      header: t('movements.columns.kind'),
      cell: (entry) => (
        <Badge tone={KIND_TONE[entry.kind]}>
          {t(`products.detail.movementKinds.${entry.kind}`)}
        </Badge>
      ),
    },
    {
      id: 'quantity',
      header: t('movements.columns.quantity'),
      numeric: true,
      cell: (entry) => (
        <bdi
          dir="ltr"
          className={cn('font-semibold', entry.delta < 0 ? 'text-danger' : 'text-success')}
        >
          {entry.delta > 0 ? `+${entry.delta}` : `−${-entry.delta}`}
        </bdi>
      ),
    },
    {
      id: 'balance',
      header: t('movements.columns.balance'),
      numeric: true,
      cell: (entry) => entry.balanceAfter ?? '—',
    },
    { id: 'reference', header: t('movements.columns.reference'), cell: reference },
    { id: 'actor', header: t('movements.columns.actor'), cell: (entry) => entry.actor },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-display">{t('movements.title')}</h1>
        <p className="mt-1 text-body text-ink-muted">{t('movements.subtitle')}</p>
      </div>
      <StockTabs />

      <div className="flex flex-wrap items-center gap-2.5">
        <select
          aria-label={t('movements.staff')}
          value={filters.actorId ?? ''}
          onChange={(event) =>
            update({ actorId: event.target.value ? Number(event.target.value) : null })
          }
          className={selectClass}
        >
          <option value="">
            {t('movements.staff')}: {t('movements.everyone')}
          </option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('movements.period')}
          value={filters.days}
          onChange={(event) => update({ days: Number(event.target.value) as MovementPeriod })}
          className={selectClass}
        >
          {MOVEMENT_PERIODS.map((period) => (
            <option key={period} value={period}>
              {t(`movements.periods.${period}`)}
            </option>
          ))}
        </select>
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="sr-only">{t('movements.kind')}</legend>
          {[null, ...MOVEMENT_KINDS].map((kind: MovementKind | null) => (
            <button
              key={kind ?? 'all'}
              type="button"
              aria-pressed={filters.kind === kind}
              onClick={() => update({ kind })}
              className={cn(
                'rounded-pill border px-3 py-1 text-small',
                filters.kind === kind
                  ? 'border-brand bg-brand-soft font-semibold text-brand-strong'
                  : 'border-border text-ink-muted hover:bg-surface-200',
              )}
            >
              {kind ? t(`products.detail.movementKinds.${kind}`) : t('movements.all')}
            </button>
          ))}
        </fieldset>
      </div>

      {data && (
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-body">
          <div className="flex gap-2">
            <dt className="text-ink-muted">{t('movements.in')}</dt>
            <dd className="tabular font-semibold text-success">
              + {t('movements.units', { count: data.totals.in })}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-muted">{t('movements.out')}</dt>
            <dd className="tabular font-semibold text-danger">
              − {t('movements.units', { count: data.totals.out })}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-muted">{t('movements.losses')}</dt>
            <dd className="tabular font-semibold">− {data.totals.losses}</dd>
          </div>
        </dl>
      )}

      <DataTable
        caption={t('movements.title')}
        columns={columns}
        rows={data?.data ?? []}
        getRowId={(entry) => String(entry.id)}
        loading={isPending}
        empty={<EmptyState title={t('movements.empty')} />}
      />
    </div>
  )
}
