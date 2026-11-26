import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { SkeletonRows } from '@/shared/ui/skeleton'
import { reportQueries } from '../api/reports-api'
import type { ReportPeriod } from '../model/types'
import { BarChart, Card, Change, PeriodBar, ReportActions, ShareBar, Stat } from './shared'

export function SalesView({
  period,
  onPeriod,
}: {
  period: ReportPeriod
  onPeriod: (period: ReportPeriod) => void
}) {
  const { t, i18n } = useTranslation()
  const { data } = useQuery(reportQueries.sales(period))
  const locale = i18n.language === 'ar' ? 'ar-PS' : 'en-GB'
  const dayOf = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })
  const monthOf = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-GB', {
    month: 'short',
    timeZone: 'UTC',
  })

  if (!data) return <SkeletonRows rows={8} />
  const { byMethod } = data
  const paid = byMethod.cash + byMethod.bank + byMethod.credit
  const share = (value: number) => (paid > 0 ? Math.round((value / paid) * 100) : 0)
  const staffMax = Math.max(0, ...data.byStaff.map((member) => member.total))
  const unit = data.series.unit
  const label = (key: string, index: number) =>
    unit === 'month'
      ? monthOf.format(new Date(`${key}-01`))
      : index === data.series.points.length - 1 && key === data.to
        ? t('reports.sales.today')
        : dayOf.format(new Date(key))

  const rows = () => [
    [t('reports.sales.total'), data.sales],
    [t('reports.sales.invoices'), data.invoices],
    [t('reports.sales.average'), data.average],
    [t('reports.sales.returns'), data.returns],
    [],
    ...data.series.points.map((point) => [point.date, point.total]),
    [],
    ...(['cash', 'bank', 'credit'] as const).map((key) => [
      t(`reports.sales.methods.${key}`),
      byMethod[key],
    ]),
    [],
    ...data.byStaff.map((member) => [member.name, member.total, member.invoices]),
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PeriodBar period={period} onChange={onPeriod} range={data} />
        <ReportActions name={`${t('reports.titles.sales')} ${data.from} ${data.to}`} rows={rows} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={t('reports.sales.total')}
          value={`${formatMoney(data.sales)} ₪`}
          sub={<Change now={data.sales} before={data.previous.sales} />}
        />
        <Stat
          label={t('reports.sales.invoices')}
          value={String(data.invoices)}
          sub={<Change now={data.invoices} before={data.previous.invoices} />}
        />
        <Stat
          label={t('reports.sales.average')}
          value={`${formatMoney(data.average)} ₪`}
          sub={<Change now={data.average} before={data.previous.average} />}
        />
        <Stat
          label={t('reports.sales.returns')}
          value={`${formatMoney(data.returns)} ₪`}
          sub={t('reports.sales.returnsShare', {
            value: data.sales > 0 ? Math.round((data.returns / data.sales) * 1000) / 10 : 0,
          })}
        />
      </div>

      <Card
        id="sales-series"
        title={unit === 'month' ? t('reports.sales.monthly') : t('reports.sales.daily')}
      >
        <BarChart
          points={data.series.points.map((point) => ({ key: point.date, total: point.total }))}
          label={label}
          caption={t('reports.sales.chart', { unit: t(`reports.sales.units.${unit}`) })}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card id="sales-method" title={t('reports.sales.byMethod')}>
          <ul className="flex flex-col gap-3">
            {(['cash', 'bank', 'credit'] as const).map((key) => (
              <ShareBar
                key={key}
                label={t(`reports.sales.methods.${key}`)}
                value={t('reports.sales.share', {
                  amount: formatMoney(byMethod[key]),
                  share: share(byMethod[key]),
                })}
                max={paid}
                sub={byMethod[key]}
              />
            ))}
          </ul>
        </Card>
        <Card id="sales-staff" title={t('reports.sales.byStaff')}>
          <ul className="flex flex-col gap-3">
            {data.byStaff.map((member) => (
              <ShareBar
                key={member.id}
                label={
                  <>
                    {member.name}{' '}
                    <span className="text-caption text-ink-muted">
                      {t('reports.sales.staffInvoices', { count: member.invoices })}
                    </span>
                  </>
                }
                value={formatMoney(member.total)}
                max={staffMax}
                sub={member.total}
              />
            ))}
          </ul>
        </Card>
      </div>

      <Card id="sales-top" title={t('reports.sales.top')}>
        <p className="text-caption text-ink-muted">{t('reports.sales.topNote')}</p>
        {data.top.length === 0 ? (
          <p className="text-small text-ink-muted">{t('reports.sales.noTop')}</p>
        ) : (
          <table className="w-full text-body">
            <caption className="sr-only">{t('reports.sales.top')}</caption>
            <thead>
              <tr className="border-b border-border text-small text-ink-muted">
                <th className="py-2 text-start font-semibold">
                  {t('reports.sales.columns.product')}
                </th>
                <th className="py-2 text-start font-semibold">
                  {t('reports.sales.columns.quantity')}
                </th>
                <th className="py-2 text-end font-semibold">{t('reports.sales.columns.total')}</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((item) => (
                <tr
                  key={`${item.productId}-${item.unit}`}
                  className="border-b border-border last:border-0"
                >
                  {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- the cell holds a link named by the product */}
                  <td className="py-2">
                    <Link
                      to={to(paths.productDetail, { id: item.productId })}
                      className="font-semibold hover:text-brand-strong hover:underline"
                    >
                      <bdi>{item.name}</bdi>
                    </Link>
                  </td>
                  <td className="tabular py-2">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="tabular py-2 text-end">{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
