import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { canAccess, type Role } from '@/entities/session'
import { paths, to } from '@/shared/config'
import { formatMoney } from '@/shared/lib/money'
import { buttonVariants } from '@/shared/ui/button'
import type { Dashboard } from '../model/types'
import { Greeting } from './parts'

interface Task {
  key: string
  title: string
  sub: string
  action: string
  href: string
}

/**
 * The pharmacist's day, most important first, and the cashier's own sales.
 * No profit or expenses here: those are the manager's.
 */
export function StaffDashboard({ data, role }: { data: Dashboard; role: Role }) {
  const { t, i18n } = useTranslation()
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })
  const stock = canAccess(role, 'stock')
  const { tasks } = data

  const list: Task[] = []
  if (stock && tasks.expired) {
    const count = tasks.expired.batches
    list.push({
      key: 'expired',
      title:
        count === 1 ? t('dashboard.tasks.expiredOne') : t('dashboard.tasks.expired', { count }),
      sub: t('dashboard.tasks.expiredSub', { names: tasks.expired.names }),
      action: t('dashboard.tasks.expiredAction'),
      href: paths.stockDamage,
    })
  }
  if (stock && tasks.count) {
    list.push({
      key: 'count',
      title: t('dashboard.tasks.count', {
        scope: tasks.count.scope ?? t('dashboard.activity.wholePharmacy'),
      }),
      sub: t('dashboard.tasks.countSub', tasks.count),
      action: t('dashboard.tasks.countAction'),
      href: paths.stockCounts,
    })
  }
  if (canAccess(role, 'purchases') && tasks.receive) {
    list.push({
      key: 'receive',
      title: t('dashboard.tasks.receive', { supplier: tasks.receive.supplier }),
      sub: t('dashboard.tasks.receiveSub', tasks.receive),
      action: t('dashboard.tasks.receiveAction'),
      href: to(paths.purchaseReceive, { id: tasks.receive.orderId }),
    })
  }

  const mine = (
    <section
      aria-labelledby="my-sales"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 p-4"
    >
      <h2 id="my-sales" className="font-display text-body-strong">
        {t('dashboard.mySales.title')}
      </h2>
      <p className="tabular font-display text-display">{formatMoney(data.mine.total)} ₪</p>
      <p className="text-small text-ink-muted">
        {t('dashboard.mySales.count', { count: data.mine.invoices })} ·{' '}
        {data.shift
          ? t('dashboard.mySales.openShift', { number: data.shift.number })
          : t('dashboard.mySales.noShift')}
      </p>
      <Link to={paths.pos} className={buttonVariants({ className: 'self-start' })}>
        {t('dashboard.mySales.pos')}
      </Link>
    </section>
  )

  if (!stock) {
    return (
      <div className="flex flex-col gap-5">
        <Greeting>{t('dashboard.cashierNote')}</Greeting>
        <div className="max-w-md">{mine}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Greeting>{t('dashboard.pharmacistNote')}</Greeting>

      <section
        aria-labelledby="today-tasks"
        className="overflow-hidden rounded-lg border border-border bg-surface-100"
      >
        <h2
          id="today-tasks"
          className="border-b border-border px-4 py-3 font-display text-body-strong"
        >
          {t('dashboard.tasks.title')}
        </h2>
        {list.length === 0 ? (
          <p className="px-4 py-3 text-small text-ink-muted">{t('dashboard.tasks.none')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((task) => (
              <li key={task.key} className="flex items-center gap-3 px-4 py-3">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-semibold">{task.title}</span>
                  <span className="text-small text-ink-muted">{task.sub}</span>
                </span>
                <Link
                  to={task.href}
                  aria-label={`${task.action}: ${task.title}`}
                  className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                >
                  {task.action}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section
          aria-labelledby="expiring-soon"
          className="rounded-lg border border-border bg-surface-100 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="expiring-soon" className="font-display text-body-strong">
              {t('dashboard.expiring.title')}
            </h2>
            <Link
              to={`${paths.products}?tab=soon`}
              className="text-small text-brand-strong hover:underline"
            >
              {t('dashboard.expiring.all', { count: data.expiring.total })}
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2.5">
            {data.expiring.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 text-small"
              >
                <Link
                  to={to(paths.productDetail, { id: item.productId })}
                  className="truncate font-semibold hover:text-brand-strong"
                >
                  <bdi>{item.name}</bdi>
                </Link>
                <span className="tabular shrink-0 text-warning">
                  {t('dashboard.expiring.line', {
                    date: date.format(new Date(item.expiry)),
                    quantity: item.quantity,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="running-low"
          className="rounded-lg border border-border bg-surface-100 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="running-low" className="font-display text-body-strong">
              {t('dashboard.low.title')}
            </h2>
            <Link
              to={`${paths.products}?tab=low`}
              className="text-small text-brand-strong hover:underline"
            >
              {t('dashboard.low.all', { count: data.low.total })}
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2.5">
            {data.low.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 text-small"
              >
                <Link
                  to={to(paths.productDetail, { id: item.productId })}
                  className="truncate font-semibold hover:text-brand-strong"
                >
                  <bdi>{item.name}</bdi>
                </Link>
                <span className="tabular shrink-0 text-danger">
                  {t('dashboard.low.line', { ...item })}
                </span>
              </li>
            ))}
          </ul>
          {data.low.draft && (
            <Link
              to={to(paths.purchaseDetail, { id: data.low.draft.id })}
              className="mt-3 block text-small text-brand-strong hover:underline"
            >
              {t('dashboard.low.onDraft', { number: data.low.draft.number })}
            </Link>
          )}
        </section>

        {mine}
      </div>
    </div>
  )
}
