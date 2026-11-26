import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { SkeletonRows } from '@/shared/ui/skeleton'
import { reportQueries } from '../api/reports-api'
import { Card, ReportActions, ShareBar, Stat } from './shared'

export function StockView() {
  const { t, i18n } = useTranslation()
  const { data } = useQuery(reportQueries.stock())
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    numberingSystem: 'latn',
    timeZone: 'UTC',
  })
  if (!data) return <SkeletonRows rows={8} />
  const money = (value: number) => formatMoney(value)
  const max = Math.max(0, ...data.byCategory.map((item) => item.value))

  const risks = [
    {
      key: 'expired',
      label: t('reports.stock.expired'),
      value: t('reports.stock.expiredValue', {
        count: data.expired.batches,
        amount: money(data.expired.value),
      }),
      action: t('reports.stock.expiredAction'),
      href: paths.stockDamage,
      tone: 'border-danger/40 bg-danger-soft text-danger',
    },
    {
      key: 'within30',
      label: t('reports.stock.within30'),
      value: t('reports.stock.productsValue', {
        count: data.within30.count,
        amount: money(data.within30.value),
      }),
      action: t('reports.stock.within30Action'),
      href: `${paths.products}?tab=soon`,
      tone: 'border-warning/40 bg-warning-soft text-warning',
    },
    {
      key: 'within90',
      label: t('reports.stock.within90'),
      value: t('reports.stock.productsValue', {
        count: data.within90.count,
        amount: money(data.within90.value),
      }),
      action: t('reports.stock.within90Action'),
      href: paths.purchases,
      tone: 'border-border bg-surface-200/60 text-ink-muted',
    },
  ]

  const rows = () => [
    [t('reports.stock.valueAtCost'), data.valueAtCost],
    [t('reports.stock.valueAtPrice'), data.valueAtPrice],
    [t('reports.stock.damage'), data.damageThisMonth],
    [t('reports.stock.stagnant'), data.stagnant.count, data.stagnant.value],
    [],
    Object.values(t('reports.stock.columns', { returnObjects: true }) as Record<string, string>),
    ...data.nearest.map((item) => [item.name, item.batch, item.expiry, item.quantity, item.value]),
    [],
    ...data.byCategory.map((item) => [item.name || t('reports.stock.noCategory'), item.value]),
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <ReportActions name={t('reports.titles.stock')} rows={rows} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t('reports.stock.valueAtCost')} value={`${money(data.valueAtCost)} ₪`} />
        <Stat label={t('reports.stock.valueAtPrice')} value={`${money(data.valueAtPrice)} ₪`} />
        <Stat
          label={t('reports.stock.damage')}
          value={`${money(data.damageThisMonth)} ₪`}
          tone={data.damageThisMonth > 0 ? 'text-danger' : undefined}
        />
        <Stat
          label={t('reports.stock.stagnant')}
          value={t('reports.stock.stagnantValue', {
            count: data.stagnant.count,
            amount: money(data.stagnant.value),
          })}
        />
      </div>

      <Card id="stock-expiry" title={t('reports.stock.expiry')}>
        <ul className="grid gap-3 md:grid-cols-3">
          {risks.map((risk) => (
            <li key={risk.key}>
              <Link
                to={risk.href}
                className={`flex h-full flex-col gap-1 rounded-md border p-3 hover:shadow-card ${risk.tone}`}
              >
                <span className="text-small">{risk.label}</span>
                <span className="tabular font-display text-body-strong text-ink">{risk.value}</span>
                <span className="text-caption">{risk.action}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card id="stock-nearest" title={t('reports.stock.nearest')}>
          <table className="w-full text-body">
            <caption className="sr-only">{t('reports.stock.nearest')}</caption>
            <thead>
              <tr className="border-b border-border text-small text-ink-muted">
                <th className="py-2 text-start font-semibold">
                  {t('reports.stock.columns.product')}
                </th>
                <th className="py-2 text-start font-semibold">
                  {t('reports.stock.columns.batch')}
                </th>
                <th className="py-2 text-start font-semibold">
                  {t('reports.stock.columns.expiry')}
                </th>
                <th className="py-2 text-start font-semibold">
                  {t('reports.stock.columns.quantity')}
                </th>
                <th className="py-2 text-end font-semibold">{t('reports.stock.columns.value')}</th>
              </tr>
            </thead>
            <tbody>
              {data.nearest.map((item) => (
                <tr
                  key={`${item.productId}-${item.batch}`}
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
                  <td className="tabular py-2 text-ink-muted">
                    <bdi dir="ltr">{item.batch}</bdi>
                  </td>
                  <td className="tabular py-2">{date.format(new Date(item.expiry))}</td>
                  <td className="tabular py-2">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="tabular py-2 text-end">{money(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card id="stock-category" title={t('reports.stock.byCategory')}>
          <ul className="flex flex-col gap-3">
            {data.byCategory.map((item) => (
              <ShareBar
                key={item.name}
                label={item.name || t('reports.stock.noCategory')}
                value={`${money(item.value)} ₪`}
                max={max}
                sub={item.value}
              />
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
