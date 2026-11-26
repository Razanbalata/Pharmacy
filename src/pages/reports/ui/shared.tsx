import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { downloadCsv } from '@/shared/lib/csv'
import { formatMoney } from '@/shared/lib/money'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Segmented } from '@/shared/ui/segmented'
import { REPORT_PERIODS, type ReportPeriod, type ReportRange } from '../model/types'

export function Card({
  title,
  children,
  className,
  id,
}: {
  title?: ReactNode
  children: ReactNode
  className?: string
  id: string
}) {
  return (
    <section
      aria-labelledby={title ? id : undefined}
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-4',
        className,
      )}
    >
      {title && (
        <h2 id={id} className="font-display text-body-strong">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: ReactNode
  tone?: string | undefined
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-100 p-4">
      <p className="text-small text-ink-muted">{label}</p>
      <p className={cn('tabular mt-1 font-display text-title', tone)}>{value}</p>
      {sub && <p className="mt-1 text-caption text-ink-muted">{sub}</p>}
    </div>
  )
}

/** "▲ 8%" against the earlier period, green up and red down. */
export function Change({
  now,
  before,
  invert = false,
}: {
  now: number
  before: number
  invert?: boolean
}) {
  const { t } = useTranslation()
  if (before <= 0) return null
  const value = Math.round(((now - before) / before) * 100)
  if (value === 0) return <span>{t('reports.same')}</span>
  const good = value > 0 !== invert
  return (
    <span className={good ? 'text-success' : 'text-danger'}>
      <bdi dir="ltr">
        {value > 0 ? t('reports.up', { value }) : t('reports.down', { value: -value })}
      </bdi>
    </span>
  )
}

/** The period buttons and the line saying which days are compared. */
export function PeriodBar({
  period,
  onChange,
  range,
}: {
  period: ReportPeriod
  onChange: (period: ReportPeriod) => void
  range?: ReportRange | undefined
}) {
  const { t, i18n } = useTranslation()
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })
  const show = (iso: string) => date.format(new Date(iso))
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented<ReportPeriod>
        label={t('reports.period')}
        value={period}
        onChange={onChange}
        options={REPORT_PERIODS.map((value) => ({ value, label: t(`reports.periods.${value}`) }))}
      />
      {range && (
        <span className="tabular text-small text-ink-muted">
          {t('reports.range', {
            from: show(range.from),
            to: show(range.to),
            compareFrom: show(range.compareFrom),
            compareTo: show(range.compareTo),
          })}
        </span>
      )}
    </div>
  )
}

/** Ask the assistant, save as a spreadsheet, or print as PDF. */
export function ReportActions({ name, rows }: { name: string; rows: () => (string | number)[][] }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Link
        to={`${paths.assistant}?view=analysis`}
        className={buttonVariants({ variant: 'secondary', size: 'sm' })}
      >
        {t('reports.assistant')}
      </Link>
      <Button size="sm" variant="secondary" onClick={() => downloadCsv(name, rows())}>
        {t('reports.excel')}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => window.print()}>
        {t('reports.pdf')}
      </Button>
    </div>
  )
}

/** A horizontal share bar: a label, its amount, and a bar its size against the largest. */
export function ShareBar({
  label,
  value,
  max,
  sub,
}: {
  label: ReactNode
  value: string
  max: number
  sub?: number
}) {
  return (
    <li className="flex flex-col gap-1">
      <span className="flex justify-between gap-2 text-small">
        <span>{label}</span>
        <span className="tabular font-semibold">{value}</span>
      </span>
      <span className="h-1.5 overflow-hidden rounded-pill bg-surface-200" aria-hidden>
        <span
          className="block h-full rounded-pill bg-brand"
          style={{ width: `${max > 0 ? Math.max(2, ((sub ?? 0) / max) * 100) : 0}%` }}
        />
      </span>
    </li>
  )
}

/**
 * Bars over time, left to right with the latest at the end. Hovering shows the bar's amount;
 * a hidden table carries every number for screen readers.
 */
export function BarChart({
  points,
  label,
  caption,
}: {
  points: { key: string; total: number }[]
  label: (key: string, index: number) => string
  caption: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...points.map((point) => point.total))
  const peak = points.reduce(
    (best, point, index) => (point.total > (points[best]?.total ?? 0) ? index : best),
    0,
  )
  const last = points.length - 1
  const tick = points.length > 12 ? 7 : 1
  return (
    <figure className="m-0 flex flex-col gap-2" dir="ltr">
      <div
        className="relative mt-6 flex h-44 items-end gap-0.5"
        onMouseLeave={() => setHover(null)}
      >
        {points.map((point, index) => (
          <div
            key={point.key}
            className="relative flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(index)}
          >
            <div
              className={cn(
                'w-full rounded-t-[4px]',
                index === last ? 'bg-ink' : 'bg-brand',
                hover !== null && hover !== index && 'opacity-50',
              )}
              style={{
                height: `${(point.total / max) * 100}%`,
                minHeight: point.total > 0 ? 2 : 0,
              }}
            />
            {(hover === index || (hover === null && (index === peak || index === last))) && (
              <span className="tabular pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-surface-100 px-1 text-caption font-semibold shadow-card">
                {hover === index ? `${label(point.key, index)} · ` : ''}
                {formatMoney(point.total)}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 text-caption text-ink-muted">
        {points.map((point, index) => (
          <span key={point.key} className="flex-1 truncate text-center">
            {index % tick === 0 || index === last ? label(point.key, index) : ''}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {points.map((point, index) => (
            <tr key={point.key}>
              <th scope="row">{label(point.key, index)}</th>
              <td>{formatMoney(point.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
