import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { SkeletonRows } from '@/shared/ui/skeleton'
import { reportQueries } from '../api/reports-api'
import type { ReportPeriod } from '../model/types'
import { Card, PeriodBar, ReportActions } from './shared'

export function ProfitView({
  period,
  onPeriod,
}: {
  period: ReportPeriod
  onPeriod: (period: ReportPeriod) => void
}) {
  const { t } = useTranslation()
  const { data } = useQuery(reportQueries.profit(period))
  if (!data) return <SkeletonRows rows={8} />

  const base = Math.max(1, data.sales)
  // Each step starts where the last one ended, so the bars walk from sales down to net profit.
  const steps = [
    {
      key: 'sales',
      label: t('reports.profit.sales'),
      value: data.sales,
      start: 0,
      bar: 'bg-brand',
      strong: true,
    },
    {
      key: 'cost',
      label: t('reports.profit.cost'),
      value: -data.cost,
      start: data.gross,
      bar: 'bg-border-strong',
    },
    {
      key: 'gross',
      label: t('reports.profit.gross', { margin: data.grossMargin }),
      value: data.gross,
      start: 0,
      bar: 'bg-brand',
      strong: true,
    },
    {
      key: 'expenses',
      label: t('reports.profit.expenses'),
      value: -data.expenses,
      start: data.gross - data.expenses,
      bar: 'bg-warning',
    },
    {
      key: 'damage',
      label: t('reports.profit.damage'),
      value: -data.damage,
      start: data.net,
      bar: 'bg-danger',
    },
    {
      key: 'net',
      label: t('reports.profit.net'),
      value: data.net,
      start: 0,
      bar: 'bg-ink',
      strong: true,
    },
  ]
  const margin = (sales: number, profit: number) =>
    sales > 0 ? Math.round((profit / sales) * 100) : 0
  const name = (row: (typeof data.byCategory)[number]) =>
    row.archived ? t('reports.profit.archived') : row.name || t('reports.profit.noCategory')

  const rows = () => [
    ...steps.map((step) => [step.label, step.value]),
    [],
    [
      t('reports.profit.columns.category'),
      t('reports.profit.columns.sales'),
      t('reports.profit.columns.profit'),
      t('reports.profit.columns.margin'),
    ],
    ...data.byCategory.map((row) => [
      name(row),
      row.sales,
      row.profit,
      `${margin(row.sales, row.profit)}%`,
    ]),
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PeriodBar period={period} onChange={onPeriod} range={data} />
        <ReportActions name={`${t('reports.titles.profit')} ${data.from} ${data.to}`} rows={rows} />
      </div>

      <Card id="profit-bridge" title={t('reports.profit.bridge')}>
        <ul className="flex flex-col gap-2.5">
          {steps.map((step) => (
            <li
              key={step.key}
              className="grid grid-cols-[10rem_1fr_7rem] items-center gap-3 text-small sm:grid-cols-[13rem_1fr_8rem]"
            >
              <span className={cn(step.strong && 'font-semibold')}>{step.label}</span>
              <span className="relative h-5 rounded bg-surface-200/60" aria-hidden>
                <span
                  className={cn('absolute inset-y-0 rounded', step.bar)}
                  style={{
                    insetInlineStart: `${(Math.max(0, step.start) / base) * 100}%`,
                    width: `${Math.max(0.5, (Math.abs(step.value) / base) * 100)}%`,
                  }}
                />
              </span>
              <span
                className={cn(
                  'tabular text-end',
                  step.strong && 'font-semibold',
                  step.key === 'net' && 'text-success',
                  step.value < 0 && 'text-ink-muted',
                )}
              >
                <bdi dir="ltr">
                  {step.value < 0 ? `− ${formatMoney(-step.value)}` : formatMoney(step.value)} ₪
                </bdi>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-small text-ink-muted">
          {data.previousNetMargin === null
            ? t('reports.profit.netNote', { margin: data.netMargin })
            : t('reports.profit.netNoteBefore', {
                margin: data.netMargin,
                before: data.previousNetMargin,
              })}
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card id="profit-category" title={t('reports.profit.byCategory')}>
          <table className="w-full text-body">
            <caption className="sr-only">{t('reports.profit.byCategory')}</caption>
            <thead>
              <tr className="border-b border-border text-small text-ink-muted">
                <th className="py-2 text-start font-semibold">
                  {t('reports.profit.columns.category')}
                </th>
                <th className="py-2 text-end font-semibold">{t('reports.profit.columns.sales')}</th>
                <th className="py-2 text-end font-semibold">
                  {t('reports.profit.columns.profit')}
                </th>
                <th className="py-2 text-end font-semibold">
                  {t('reports.profit.columns.margin')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.byCategory.map((row, index) => {
                const value = margin(row.sales, row.profit)
                return (
                  <tr key={`${row.id}-${index}`} className="border-b border-border last:border-0">
                    <td className="py-2">{name(row)}</td>
                    <td className="tabular py-2 text-end">{formatMoney(row.sales)}</td>
                    <td className="tabular py-2 text-end">{formatMoney(row.profit)}</td>
                    {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the cell holds a badge with the margin, not a control */}
                    <td className="py-2 text-end">
                      <Badge tone={value < 25 ? 'warning' : 'success'}>
                        <bdi dir="ltr">{value}%</bdi>
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
        <Card id="profit-low" title={t('reports.profit.lowMargin')}>
          <p className="text-small text-ink-muted">{t('reports.profit.lowMarginNote')}</p>
          {data.lowMargin.length === 0 ? (
            <p className="text-small">{t('reports.profit.noLowMargin')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.lowMargin.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-2 text-small"
                >
                  <Link
                    to={to(paths.productDetail, { id: item.productId })}
                    className="truncate font-semibold hover:text-brand-strong hover:underline"
                  >
                    <bdi>{item.name}</bdi>
                  </Link>
                  <Badge tone="warning">
                    <bdi dir="ltr">{item.margin}%</bdi>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
