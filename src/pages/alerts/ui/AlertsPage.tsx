import { CheckCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  ALERT_GROUPS,
  AlertItem,
  alertQueries,
  type Alert,
  type AlertGroup,
} from '@/entities/alert'
import { MarkAllReadButton, useMarkAlertRead } from '@/features/alert/mark-read'
import { paths } from '@/shared/config'
import { EmptyState } from '@/shared/ui/empty-state'
import { Segmented } from '@/shared/ui/segmented'
import { SkeletonRows } from '@/shared/ui/skeleton'

type Filter = AlertGroup | 'all'

const DAY_MS = 86_400_000

/** Every alert, grouped by what it is about, each with the button that fixes it. */
export function AlertsPage() {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const { data, isPending } = useQuery(alertQueries.list())
  const markRead = useMarkAlertRead()
  const [days] = useState(() => {
    const now = Date.now()
    return {
      today: new Date(now).toISOString().slice(0, 10),
      yesterday: new Date(now - DAY_MS).toISOString().slice(0, 10),
    }
  })
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
  })
  // The fake server lives on a fixed day; its "today" is the newest date among the alerts.
  const newest = data?.data
    .map((alert) => alert.at.slice(0, 10))
    .sort()
    .at(-1)
  const when = (alert: Alert) => {
    const day = alert.at.slice(0, 10)
    if (day === days.today || day === newest) return t('alerts.today')
    const before = new Date(Date.parse(`${newest ?? days.today}T00:00:00Z`) - DAY_MS)
    if (day === days.yesterday || day === before.toISOString().slice(0, 10)) {
      return t('alerts.yesterday')
    }
    return date.format(new Date(alert.at))
  }

  const alerts = data?.data ?? []
  const summary = data?.summary
  const groups = ALERT_GROUPS.filter((group) => filter === 'all' || filter === group)
    .map((group) => ({ group, items: alerts.filter((alert) => alert.group === group) }))
    .filter(({ items }) => items.length > 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display">{t('alerts.title')}</h1>
          <p className="mt-1 text-body text-ink-muted">
            {t('alerts.subtitle')}{' '}
            {summary &&
              (summary.unread > 0
                ? t('alerts.unread', { count: summary.unread })
                : t('alerts.allRead'))}
          </p>
        </div>
        <MarkAllReadButton disabled={!summary || summary.unread === 0} />
      </div>

      {summary && (
        <div>
          <Segmented<Filter>
            label={t('alerts.filter')}
            value={filter}
            onChange={setFilter}
            options={(['all', ...ALERT_GROUPS] as const).map((value) => ({
              value,
              label: `${t(`alerts.groups.${value}`)} · ${summary.counts[value]}`,
            }))}
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {isPending && <SkeletonRows rows={6} />}
          {!isPending && groups.length === 0 && (
            <EmptyState
              icon={<CheckCheck className="size-6" />}
              tone="brand"
              title={filter === 'all' ? t('alerts.empty') : t('alerts.emptyGroup')}
            />
          )}
          {groups.map(({ group, items }) => (
            <section
              key={group}
              aria-labelledby={`alerts-${group}`}
              className="overflow-hidden rounded-lg border border-border bg-surface-100 shadow-card"
            >
              <h2
                id={`alerts-${group}`}
                className="border-b border-border px-4 py-3 font-display text-body-strong"
              >
                {t('alerts.groupTitle', {
                  group: t(`alerts.groups.${group}`),
                  count: summary?.counts[group] ?? items.length,
                })}
              </h2>
              <ul className="divide-y divide-border">
                {items.map((alert) => (
                  <li key={alert.id}>
                    <AlertItem alert={alert} when={when(alert)} onOpen={markRead} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside
          aria-labelledby="alert-channels"
          className="flex flex-col gap-3 self-start rounded-lg border border-border bg-surface-100 shadow-card p-4"
        >
          <h2 id="alert-channels" className="font-display text-body-strong">
            {t('alerts.channels.title')}
          </h2>
          <ul className="flex flex-col gap-2 text-body">
            <li className="flex items-center justify-between gap-2">
              <span>{t('alerts.channels.app')}</span>
              <span aria-hidden className="text-success">
                ✓
              </span>
            </li>
            {(['telegram', 'whatsapp'] as const).map((channel) => (
              <li key={channel} className="flex items-center justify-between gap-2 text-ink-muted">
                <span>{t(`alerts.channels.${channel}`)}</span>
                <span className="rounded-pill bg-surface-200 px-2 text-caption">
                  {t('alerts.channels.later')}
                </span>
              </li>
            ))}
          </ul>
          {summary && (
            <p className="text-small text-ink-muted">
              {t('alerts.channels.rule', { days: summary.expiryAlertDays })}
            </p>
          )}
          <Link
            to={paths.settings}
            className="text-small font-semibold text-brand-strong hover:underline"
          >
            {t('alerts.channels.settings')}
          </Link>
        </aside>
      </div>
    </div>
  )
}
