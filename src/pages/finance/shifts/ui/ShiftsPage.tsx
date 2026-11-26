import { Inbox } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  SHIFT_PERIODS,
  shiftQueries,
  type ShiftFilters,
  type ShiftPeriod,
  type ShiftRecord,
} from '@/entities/shift'
import { staffQueries } from '@/entities/staff-member'
import { FinanceTabs } from '@/widgets/finance-tabs'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { downloadCsv } from '@/shared/lib/csv'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Field } from '@/shared/ui/field'
import { Segmented } from '@/shared/ui/segmented'
import { DataTable, type Column } from '@/shared/ui/table'

const DAY_MS = 86_400_000
const select = 'h-9 rounded-lg border border-border bg-surface-100 px-3 text-body'

/** A difference with its sign in front: "+ 2.00", "− 6.00", or "0.00". */
function signed(value: number): string {
  if (value > 0) return `+ ${formatMoney(value)}`
  if (value < 0) return `− ${formatMoney(-value)}`
  return formatMoney(0)
}

interface StatProps {
  label: string
  value: string
  tone?: string | undefined
  /** A signed amount, kept left to right so the minus stays in front. */
  ltr?: boolean
}

function Stat({ label, value, tone, ltr = false }: StatProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-100 shadow-card p-4">
      <p className="text-small text-ink-muted">{label}</p>
      <p className={cn('tabular mt-1 font-display text-title', tone)}>
        {ltr ? <bdi dir="ltr">{value}</bdi> : value}
      </p>
    </div>
  )
}

/** Every shift: who had the drawer, what it should have held, and what was counted. */
export function ShiftsPage() {
  const { t, i18n } = useTranslation()
  const [filters, setFilters] = useState<ShiftFilters>({
    period: 'week',
    cashierId: null,
    withDifference: false,
  })
  const { data, isPending } = useQuery(shiftQueries.list(filters))
  const { data: staff = [] } = useQuery(staffQueries.list())
  const [days] = useState(() => {
    const now = Date.now()
    return {
      today: new Date(now).toISOString().slice(0, 10),
      yesterday: new Date(now - DAY_MS).toISOString().slice(0, 10),
    }
  })
  const locale = i18n.language === 'ar' ? 'ar-PS' : 'en-GB'
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    numberingSystem: 'latn',
  })
  const day = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })

  const when = (shift: ShiftRecord) => {
    const opened = new Date(shift.openedAt)
    const at = time.format(opened)
    const date = shift.openedAt.slice(0, 10)
    const start =
      date === days.today
        ? t('shifts.today', { time: at })
        : date === days.yesterday
          ? t('shifts.yesterday', { time: at })
          : `${day.format(opened)} ${at}`
    const end = shift.closedAt ? time.format(new Date(shift.closedAt)) : t('shifts.stillOpen')
    return { start, end }
  }
  const money = (value: number | null) => (value === null ? '—' : formatMoney(value))

  const columns: Column<ShiftRecord>[] = [
    {
      id: 'number',
      header: t('shifts.columns.number'),
      cell: (shift) =>
        shift.status === 'open' ? (
          <Link
            to={paths.shift}
            aria-label={t('shifts.openLink', { number: shift.number })}
            className="tabular font-semibold text-brand-strong hover:underline"
          >
            {shift.number}
          </Link>
        ) : (
          <span className="tabular font-semibold">{shift.number}</span>
        ),
    },
    { id: 'staff', header: t('shifts.columns.staff'), cell: (shift) => shift.cashier.name },
    {
      id: 'time',
      header: t('shifts.columns.time'),
      cell: (shift) => {
        const { start, end } = when(shift)
        // Each end on its own, so dates and times keep their order in a right-to-left line.
        return (
          <span className="tabular whitespace-nowrap">
            <bdi>{start}</bdi> · <bdi>{end}</bdi>
          </span>
        )
      },
    },
    {
      id: 'sales',
      header: t('shifts.columns.sales'),
      numeric: true,
      cell: (shift) => formatMoney(shift.sales),
    },
    {
      id: 'expected',
      header: t('shifts.columns.expected'),
      numeric: true,
      cell: (shift) => money(shift.expectedCash),
    },
    {
      id: 'counted',
      header: t('shifts.columns.counted'),
      numeric: true,
      cell: (shift) => money(shift.countedCash),
    },
    {
      id: 'difference',
      header: t('shifts.columns.difference'),
      numeric: true,
      cell: (shift) =>
        shift.difference === null ? (
          '—'
        ) : (
          <bdi
            dir="ltr"
            className={cn(
              'font-semibold',
              shift.difference < 0 && 'text-danger',
              shift.difference > 0 && 'text-success',
              shift.difference === 0 && 'text-ink-muted',
            )}
          >
            {signed(shift.difference)}
          </bdi>
        ),
    },
    {
      id: 'status',
      header: t('shifts.columns.status'),
      cell: (shift) => (
        <Badge tone={shift.status === 'open' ? 'success' : 'neutral'}>
          {t(`shifts.statuses.${shift.status}`)}
        </Badge>
      ),
    },
    {
      id: 'note',
      header: t('shifts.columns.note'),
      cell: (shift) => <span className="text-small text-ink-muted">{shift.note}</span>,
    },
  ]

  const shifts = data?.data ?? []
  function exportLog() {
    downloadCsv(t('shifts.exportFile'), [
      [
        t('shifts.columns.number'),
        t('shifts.columns.staff'),
        t('shifts.columns.time'),
        t('shifts.columns.sales'),
        t('shifts.columns.expected'),
        t('shifts.columns.counted'),
        t('shifts.columns.difference'),
        t('shifts.columns.note'),
      ],
      ...shifts.map((shift) => [
        shift.number,
        shift.cashier.name,
        Object.values(when(shift)).join(' · '),
        shift.sales,
        shift.expectedCash ?? '',
        shift.countedCash ?? '',
        shift.difference ?? '',
        shift.note,
      ]),
    ])
  }

  const summary = data?.summary
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('shifts.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">{t('shifts.subtitle')}</p>
        </div>
        <Button variant="secondary" onClick={exportLog} disabled={shifts.length === 0}>
          {t('finance.export')}
        </Button>
      </div>
      <FinanceTabs />

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label={t('shifts.openNow')}
            tone="text-success"
            value={
              summary.open
                ? t('shifts.openValue', {
                    number: summary.open.number,
                    name: summary.open.cashier.split(' ')[0],
                  })
                : t('shifts.noneOpen')
            }
          />
          <Stat label={t('shifts.count')} value={String(summary.count)} />
          <Stat
            label={t('shifts.totalDifference')}
            ltr
            tone={summary.totalDifference < 0 ? 'text-danger' : undefined}
            value={`${signed(summary.totalDifference)} ₪`}
          />
          <Stat
            label={t('shifts.shortCount')}
            tone={summary.shortCount > 0 ? 'text-danger' : undefined}
            value={String(summary.shortCount)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Field label={t('shifts.staff')}>
          {(field) => (
            <select
              {...field}
              value={filters.cashierId ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  cashierId: event.target.value ? Number(event.target.value) : null,
                }))
              }
              className={select}
            >
              <option value="">{t('shifts.allStaff')}</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Segmented<ShiftPeriod>
          label={t('shifts.period')}
          value={filters.period}
          onChange={(period) => setFilters((current) => ({ ...current, period }))}
          options={SHIFT_PERIODS.map((value) => ({
            value,
            label: t(`shifts.periods.${value}`),
          }))}
        />
        <label className="flex h-9 items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={filters.withDifference}
            onChange={(event) =>
              setFilters((current) => ({ ...current, withDifference: event.target.checked }))
            }
            className="size-4 accent-brand"
          />
          {t('shifts.onlyDifference')}
        </label>
      </div>

      <DataTable
        caption={t('shifts.title')}
        columns={columns}
        rows={shifts}
        getRowId={(shift) => String(shift.id)}
        loading={isPending}
        empty={<EmptyState icon={<Inbox className="size-6" />} title={t('shifts.empty')} />}
      />
    </div>
  )
}
