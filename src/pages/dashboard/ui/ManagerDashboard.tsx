import {
  CalendarX2,
  HandCoins,
  Hourglass,
  PackageCheck,
  PackagePlus,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths, to } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { buttonVariants } from '@/shared/ui/button'
import type { Dashboard, DashboardEvent, DashboardNote } from '../model/types'
import { Greeting } from './parts'
import { SalesTrend } from './SalesTrend'
import { SmartAnalysisButton } from '@/widgets/smart-analysis'

const TONES = {
  danger: 'border-danger/40 bg-danger-soft text-danger',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  info: 'border-info/40 bg-info-soft text-info',
} as const

interface Card {
  key: string
  icon: ReactNode
  title: string
  sub: ReactNode
  href: string
  tone: keyof typeof TONES
}

/** The manager's morning: what needs her, today's numbers, the trend, and what happened. */
export function ManagerDashboard({ data }: { data: Dashboard }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ar' ? 'ar-PS' : 'en-GB'
  const day = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    numberingSystem: 'latn',
  })
  const { attention, sales } = data

  const cards: Card[] = []
  if (attention.expired.batches > 0) {
    const count = attention.expired.batches
    cards.push({
      key: 'expired',
      icon: <CalendarX2 className="size-5" />,
      title:
        count === 1 ? t('dashboard.cards.expiredOne') : t('dashboard.cards.expired', { count }),
      sub: t('dashboard.cards.expiredSub'),
      href: paths.stockDamage,
      tone: 'danger',
    })
  }
  if (attention.expiring.count > 0 && attention.expiring.nearest) {
    const { count, nearest } = attention.expiring
    cards.push({
      key: 'expiring',
      icon: <Hourglass className="size-5" />,
      title:
        count === 1 ? t('dashboard.cards.expiringOne') : t('dashboard.cards.expiring', { count }),
      sub: t('dashboard.cards.expiringSub', {
        name: nearest.name,
        date: day.format(new Date(nearest.expiry)),
      }),
      href: `${paths.products}?tab=soon`,
      tone: 'warning',
    })
  }
  if (attention.low.count > 0 && attention.low.urgent) {
    const { count, urgent } = attention.low
    cards.push({
      key: 'low',
      icon: <TriangleAlert className="size-5" />,
      title: count === 1 ? t('dashboard.cards.lowOne') : t('dashboard.cards.low', { count }),
      // The English name on its own, so the Arabic around it keeps its order.
      sub: (
        <>
          <bdi>{urgent.name}</bdi>: {t('dashboard.cards.lowSub', { ...urgent })}
        </>
      ),
      href: paths.purchases,
      tone: 'warning',
    })
  }
  if (attention.lateDebts.count > 0) {
    const { count, amount } = attention.lateDebts
    cards.push({
      key: 'debts',
      icon: <HandCoins className="size-5" />,
      title: t('dashboard.cards.debts', { amount: formatMoney(amount) }),
      sub:
        count === 1 ? t('dashboard.cards.debtsSubOne') : t('dashboard.cards.debtsSub', { count }),
      href: paths.customers,
      tone: 'info',
    })
  }

  const kpis = [
    {
      key: 'sales',
      label: t('dashboard.kpis.sales'),
      value: `${formatMoney(sales.today)} ₪`,
      sub: t('dashboard.kpis.salesSub', {
        count: sales.invoices,
        yesterday: formatMoney(sales.yesterday),
      }),
      href: paths.invoices,
    },
    {
      key: 'profit',
      label: t('dashboard.kpis.profit'),
      value: `${formatMoney(sales.profit ?? 0)} ₪`,
      sub: t('dashboard.kpis.profitSub', { margin: sales.margin ?? 0 }),
      href: paths.reports,
      tone: 'text-brand-strong',
    },
    {
      key: 'drawer',
      label: t('dashboard.kpis.drawer'),
      value: data.drawer ? `${formatMoney(data.drawer.expected)} ₪` : '—',
      sub: data.drawer
        ? t('dashboard.kpis.drawerSub', { number: data.drawer.shiftNumber })
        : t('dashboard.kpis.drawerClosed'),
      href: paths.shift,
    },
    {
      key: 'expired',
      label: t('dashboard.kpis.expired'),
      value: String(data.expiredProducts),
      sub: t('dashboard.kpis.expiredSub'),
      href: paths.stockDamage,
      tone: data.expiredProducts > 0 ? 'text-danger' : undefined,
    },
  ]

  const noteText = (note: DashboardNote) => {
    switch (note.kind) {
      case 'expiring':
        return {
          tag: t('dashboard.notes.expiring'),
          dot: 'bg-warning',
          text: t('dashboard.notes.expiringText', {
            name: note.name,
            date: day.format(new Date(note.expiry)),
            quantity: note.quantity,
          }),
          href: to(paths.productDetail, { id: note.productId }),
        }
      case 'shortage':
        return {
          tag: t('dashboard.notes.shortage'),
          dot: 'bg-danger',
          text: note.draft
            ? t('dashboard.notes.shortageDraft', { name: note.name, number: note.draft.number })
            : t('dashboard.notes.shortageText', { ...note }),
          href: note.draft
            ? to(paths.purchaseDetail, { id: note.draft.id })
            : to(paths.productDetail, { id: note.productId }),
        }
      case 'topSeller':
        return {
          tag: t('dashboard.notes.topSeller'),
          dot: 'bg-brand',
          text: t('dashboard.notes.topSellerText', { ...note }),
          href: to(paths.productDetail, { id: note.productId }),
        }
    }
  }

  const eventText = (event: DashboardEvent) => {
    const params: Record<string, string | number> = {
      ...event.params,
      actor: event.actor,
      amount: typeof event.params.amount === 'number' ? formatMoney(event.params.amount) : '',
    }
    if (event.kind === 'countStarted' && !event.params.scope) {
      params.scope = t('dashboard.activity.wholePharmacy')
    }
    return t(`dashboard.activity.${event.kind}`, params)
  }

  const actions = [
    [ShoppingCart, 'sale', paths.pos],
    [PackageCheck, 'receive', paths.purchases],
    [PackagePlus, 'product', paths.productNew],
    [HandCoins, 'debt', paths.customers],
  ] as const

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Greeting>
          {cards.length === 0
            ? t('dashboard.attentionNone')
            : cards.length === 1
              ? t('dashboard.attentionOne')
              : t('dashboard.attention', { count: cards.length })}
        </Greeting>
        <SmartAnalysisButton className={buttonVariants({ variant: 'secondary' })}>
          <Sparkles className="size-4" />
          {t('dashboard.assistant')}
        </SmartAnalysisButton>
      </div>

      {cards.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <li key={card.key}>
              <Link
                to={card.href}
                className={cn(
                  'flex h-full items-start gap-3 rounded-lg border p-4 hover:shadow-card',
                  TONES[card.tone],
                )}
              >
                <span aria-hidden className="mt-0.5 shrink-0">
                  {card.icon}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold text-ink">{card.title}</span>
                  <span className="text-small">{card.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <li key={kpi.key}>
            <Link
              to={kpi.href}
              className="flex h-full flex-col rounded-lg border border-border bg-surface-100 shadow-card p-4 hover:border-border-strong"
            >
              <span className="text-small text-ink-muted">{kpi.label}</span>
              <span className={cn('tabular mt-1 font-display text-title', kpi.tone)}>
                {kpi.value}
              </span>
              <span className="mt-1 text-caption text-ink-muted">{kpi.sub}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <SalesTrend />
        <section
          aria-labelledby="quick-notes"
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-4"
        >
          <h2 id="quick-notes" className="flex items-center gap-2 font-display text-body-strong">
            <Sparkles aria-hidden className="size-4 text-brand" />
            {t('dashboard.notes.title')}
          </h2>
          {data.notes.length === 0 ? (
            <p className="text-small text-ink-muted">{t('dashboard.notes.none')}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.notes.map((note) => {
                const view = noteText(note)
                return (
                  <li key={note.kind}>
                    <Link to={view.href} className="flex flex-col gap-1 hover:text-brand-strong">
                      <span className="flex items-center gap-2 text-caption text-ink-muted">
                        <span aria-hidden className={cn('size-2 rounded-pill', view.dot)} />
                        {view.tag}
                      </span>
                      <span className="text-small">{view.text}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          <SmartAnalysisButton className="mt-auto self-start text-small font-semibold text-brand-strong hover:underline">
            {t('dashboard.notes.full')}
          </SmartAnalysisButton>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section
          aria-labelledby="quick-actions"
          className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
        >
          <h2 id="quick-actions" className="font-display text-body-strong">
            {t('dashboard.actions.title')}
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {actions.map(([Icon, key, href]) => (
              <li key={key}>
                <Link
                  to={href}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border p-3.5 text-small font-medium transition-colors hover:border-brand hover:bg-brand-soft/40 hover:text-brand-strong"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  {t(`dashboard.actions.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="today-activity"
          className="rounded-lg border border-border bg-surface-100 shadow-card p-4"
        >
          <h2 id="today-activity" className="font-display text-body-strong">
            {t('dashboard.activity.title')}
          </h2>
          {data.activity.length === 0 ? (
            <p className="mt-3 text-small text-ink-muted">{t('dashboard.activity.empty')}</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2.5">
              {data.activity.map((event) => (
                <li key={`${event.kind}-${event.at}`} className="flex gap-3 text-small">
                  <span className="tabular w-12 shrink-0 text-ink-muted">
                    {time.format(new Date(event.at))}
                  </span>
                  <span>{eventText(event)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
