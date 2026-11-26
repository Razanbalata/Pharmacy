import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/entities/session'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { whatsappLink } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { SkeletonRows } from '@/shared/ui/skeleton'
import { reportQueries } from '../api/reports-api'
import { Card, ReportActions, ShareBar } from './shared'

export function DebtsView() {
  const { t } = useTranslation()
  const { data } = useQuery(reportQueries.debts())
  const { data: user } = useCurrentUser()
  const [remind, setRemind] = useState(false)
  if (!data) return <SkeletonRows rows={8} />
  const pharmacy = user && 'pharmacy' in user ? user.pharmacy.name : ''
  const { customers, suppliers } = data
  const gap = Math.round((suppliers.total - customers.total) * 100) / 100
  const max = Math.max(0, ...suppliers.list.map((item) => item.balance))

  const rows = () => [
    [t('reports.debts.customers'), customers.total],
    [t('reports.debts.recent'), customers.recent],
    [t('reports.debts.weeks'), customers.weeks],
    [t('reports.debts.late'), customers.late],
    [],
    ...data.top.map((item) => [item.name, item.debt, item.days]),
    [],
    [t('reports.debts.suppliers'), suppliers.total],
    ...suppliers.list.map((item) => [item.name, item.balance]),
  ]

  const buckets = [
    ['recent', customers.recent, ''],
    ['weeks', customers.weeks, 'text-warning'],
    ['late', customers.late, 'text-danger'],
  ] as const

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <ReportActions name={t('reports.titles.debts')} rows={rows} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card id="debts-customers" title={t('reports.debts.customers')}>
          <p className="tabular font-display text-display">{formatMoney(customers.total)} ₪</p>
          <dl className="grid grid-cols-3 gap-2">
            {buckets.map(([key, value, tone]) => (
              <div key={key} className="rounded-md bg-surface-200/60 p-2">
                <dt className="text-caption text-ink-muted">{t(`reports.debts.${key}`)}</dt>
                <dd className={cn('tabular font-semibold', tone)}>{formatMoney(value)} ₪</dd>
              </div>
            ))}
          </dl>
          <ul className="flex flex-col divide-y divide-border">
            {data.top.map((item) => (
              <li
                key={item.customerId}
                className="flex items-center justify-between gap-2 py-2 text-small"
              >
                <Link
                  to={to(paths.customerDetail, { id: item.customerId })}
                  className="font-semibold hover:text-brand-strong hover:underline"
                >
                  {item.name}
                </Link>
                <span className={cn('tabular', item.late && 'text-danger')}>
                  {item.late
                    ? t('reports.debts.lateLine', {
                        amount: formatMoney(item.debt),
                        days: item.days,
                      })
                    : `${formatMoney(item.debt)} ₪`}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            {data.reminders.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                aria-expanded={remind}
                onClick={() => setRemind((value) => !value)}
              >
                {t('reports.debts.remind', { count: data.reminders.length })}
              </Button>
            )}
            <Link
              to={paths.customers}
              className="text-small font-semibold text-brand-strong hover:underline"
            >
              {t('reports.debts.allCustomers')}
            </Link>
          </div>
          {remind && (
            <ul className="flex flex-col gap-1">
              {data.reminders.map((item) => (
                <li key={item.customerId}>
                  <a
                    href={whatsappLink(
                      item.phone,
                      t('reports.debts.remindText', {
                        name: item.name,
                        pharmacy,
                        amount: formatMoney(item.debt),
                      }),
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="text-small text-success hover:underline"
                  >
                    WhatsApp · {item.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="text-small text-ink-muted">
            {t('reports.debts.collected', { amount: formatMoney(data.collectedThisMonth) })}
          </p>
        </Card>

        <Card id="debts-suppliers" title={t('reports.debts.suppliers')}>
          <p className="tabular font-display text-display">{formatMoney(suppliers.total)} ₪</p>
          <ul className="flex flex-col gap-3">
            {suppliers.list.map((item) => (
              <ShareBar
                key={item.supplierId}
                label={
                  <Link
                    to={to(paths.supplierDetail, { id: item.supplierId })}
                    className="hover:underline"
                  >
                    {item.name}
                  </Link>
                }
                value={`${formatMoney(item.balance)} ₪`}
                max={max}
                sub={item.balance}
              />
            ))}
          </ul>
          <Link
            to={paths.suppliers}
            className="text-small font-semibold text-brand-strong hover:underline"
          >
            {t('reports.debts.allSuppliers')}
          </Link>
          <p className="rounded-md bg-surface-200/60 px-3 py-2 text-small">
            {gap > 0
              ? t('reports.debts.gap', { amount: formatMoney(gap) })
              : t('reports.debts.covered', { amount: formatMoney(-gap) })}
          </p>
        </Card>
      </div>
    </div>
  )
}
