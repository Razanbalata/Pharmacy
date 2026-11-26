import { useQuery } from '@tanstack/react-query'
import { useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { Segmented } from '@/shared/ui/segmented'
import { Skeleton } from '@/shared/ui/skeleton'
import { dashboardQueries } from '../api/dashboard-api'
import { TREND_DAYS, type TrendDays, type TrendPoint } from '../model/types'

const WIDTH = 640
const HEIGHT = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 48 }

/** A round top for the scale: 2,745 → 3,000. */
function niceMax(value: number): number {
  if (value <= 0) return 100
  const step = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / (step / 2)) * (step / 2)
}

/**
 * One line of sales per day. Time runs left to right with today at the end, as on the design,
 * whatever the language. A hidden table carries the same numbers for screen readers.
 */
export function SalesTrend() {
  const { t, i18n } = useTranslation()
  const [days, setDays] = useState<TrendDays>('7')
  const [hover, setHover] = useState<number | null>(null)
  const { data: points = [], isPending } = useQuery(dashboardQueries.trend(days))
  const locale = i18n.language === 'ar' ? 'ar-PS' : 'en-GB'
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' })
  const short = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })

  const max = niceMax(Math.max(...points.map((point) => point.total), 0))
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const x = (index: number) =>
    PAD.left + (points.length > 1 ? (index / (points.length - 1)) * plotW : plotW / 2)
  const y = (value: number) => PAD.top + plotH - (value / max) * plotH
  const line = points.map((point, index) => `${x(index)},${y(point.total)}`).join(' ')
  const area = points.length
    ? `${line} ${x(points.length - 1)},${PAD.top + plotH} ${x(0)},${PAD.top + plotH}`
    : ''
  const last = points.length - 1
  const every = days === '7' ? 1 : days === '30' ? 7 : 15
  const label = (point: TrendPoint, index: number) =>
    index === last
      ? t('dashboard.trend.today')
      : days === '7'
        ? weekday.format(new Date(point.date))
        : short.format(new Date(point.date))
  const total = points.reduce((sum, point) => sum + point.total, 0)

  function move(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const at = ((event.clientX - box.left) / box.width) * WIDTH
    const index = Math.round(((at - PAD.left) / plotW) * (points.length - 1))
    setHover(Math.min(last, Math.max(0, index)))
  }

  const shown = hover ?? last
  const tip = points[shown]

  return (
    <section
      aria-labelledby="sales-trend"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sales-trend" className="font-display text-body-strong">
            {t('dashboard.trend.title')}
          </h2>
          <p className="text-small text-ink-muted">
            {t('dashboard.trend.subtitle', { days })} ·{' '}
            {t('dashboard.trend.total', { amount: formatMoney(total) })}
          </p>
        </div>
        <Segmented<TrendDays>
          label={t('dashboard.trend.days')}
          value={days}
          onChange={(value) => {
            setDays(value)
            setHover(null)
          }}
          options={TREND_DAYS.map((value) => ({
            value,
            label: t(`dashboard.trend.periods.${value}`),
          }))}
        />
      </div>

      {isPending ? (
        <Skeleton className="h-56" />
      ) : (
        <figure className="relative m-0" dir="ltr">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full touch-none"
            aria-hidden
            onPointerMove={move}
            onPointerLeave={() => setHover(null)}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((share) => (
              <g key={share}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y(max * share)}
                  y2={y(max * share)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(max * share) + 4}
                  textAnchor="end"
                  className="fill-ink-muted text-[11px]"
                >
                  {Math.round(max * share).toLocaleString('en-US')}
                </text>
              </g>
            ))}
            <polygon points={area} className="fill-brand-soft opacity-70" />
            <polyline
              points={line}
              fill="none"
              className="stroke-brand"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((point, index) =>
              index % every === 0 || index === last ? (
                <text
                  key={point.date}
                  x={x(index)}
                  y={HEIGHT - 8}
                  textAnchor={index === 0 ? 'start' : index === last ? 'end' : 'middle'}
                  className={cn(
                    'text-[11px]',
                    index === last ? 'fill-ink font-semibold' : 'fill-ink-muted',
                  )}
                >
                  {label(point, index)}
                </text>
              ) : null,
            )}
            {tip && (
              <>
                <line
                  x1={x(shown)}
                  x2={x(shown)}
                  y1={PAD.top}
                  y2={PAD.top + plotH}
                  className="stroke-ink-muted"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x(shown)}
                  cy={y(tip.total)}
                  r={5}
                  className="fill-brand stroke-surface-100"
                  strokeWidth={2}
                />
              </>
            )}
          </svg>
          {tip && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-border bg-surface-100 px-2.5 py-1.5 text-caption shadow-card"
              style={{ left: `${Math.min(88, Math.max(12, (x(shown) / WIDTH) * 100))}%` }}
            >
              <span className="block text-ink-muted">{label(tip, shown)}</span>
              <span className="tabular font-semibold">{formatMoney(tip.total)} ₪</span>
            </div>
          )}
          <table className="sr-only">
            <caption>{t('dashboard.trend.label')}</caption>
            <tbody>
              {points.map((point, index) => (
                <tr key={point.date}>
                  <th scope="row">{label(point, index)}</th>
                  <td>{formatMoney(point.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </section>
  )
}
