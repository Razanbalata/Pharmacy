import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router'
import { useAlertSummary } from '@/entities/alert'
import { navigationFor, type CurrentUser } from '@/entities/session'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { daysUntil } from '@/shared/lib/date'
import { NAV_ICONS } from '@/shared/ui/icon'
import { Sparkles } from 'lucide-react'

interface SidebarProps {
  user: CurrentUser
  /** Called after a link is followed, so the mobile menu can close. */
  onNavigate?: () => void
}

function PlanLine({ user }: { user: CurrentUser }) {
  const { t } = useTranslation()
  const { plan, planEndsAt } = user.pharmacy
  if (plan !== 'trial') return <>{t('shell.plan', { plan: t(`shell.plans.${plan}`) })}</>
  const days = daysUntil(planEndsAt)
  return <>{days >= 0 ? t('shell.trial', { days }) : t('shell.trialEnded')}</>
}

/**
 * The menu on the start side: white by day, the page colour by night. Shows only what the
 * user's role may open.
 */
export function Sidebar({ user, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  const { data: alerts } = useAlertSummary()
  const groups = navigationFor(user.role)
  const { pathname } = useLocation()

  return (
    <nav
      aria-label={t('nav.main')}
      className="flex h-full min-h-0 flex-col gap-1 border-e border-border bg-sidebar px-3 py-5 text-ink"
    >
      <Link
        to={paths.dashboard}
        onClick={onNavigate}
        className="flex items-center gap-3 px-2.5 pb-5"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand font-display text-subheading text-on-brand shadow-card">
          ف
        </span>
        <span className="flex flex-col">
          <span className="font-display text-body-strong">{t('app.name')}</span>
          <span className="text-small text-ink-muted">{user.pharmacy.name}</span>
        </span>
      </Link>

      <div className="nav-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
        {groups.map((group) => (
          <div key={group.title ?? 'top'} className="flex flex-col gap-0.5">
            {group.title && (
              <p className="px-3 pt-5 pb-1.5 text-caption tracking-wide text-ink-muted/80">
                {t(`nav.groups.${group.title}`)}
              </p>
            )}
            {group.items.map((item) => {
              const count = item.key === 'alerts' && alerts?.unread ? alerts.unread : null
              const related = item.also?.some((key) => pathname.startsWith(paths[key])) ?? false
              return (
                <NavLink
                  key={item.key}
                  to={paths[item.key]}
                  end={item.key === 'dashboard'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-body font-medium transition-colors',
                      isActive || related
                        ? 'bg-brand-soft font-semibold text-brand-strong'
                        : 'text-ink/85 hover:bg-surface-200 hover:text-ink',
                    )
                  }
                >
                  {(() => {
                    const Icon = NAV_ICONS[item.key]
                    return Icon ? (
                      <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={2} />
                    ) : null
                  })()}
                  <span className="flex-1">{t(`nav.${item.key}`)}</span>
                  {count !== null && (
                    <span className="tabular rounded-pill bg-warning-soft px-2 text-caption text-warning">
                      {count}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 pt-4">
        {user.role !== 'cashier' && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-200/50 p-3.5">
            <p className="flex items-center gap-2 font-display text-small font-semibold">
              <Sparkles aria-hidden className="size-4 text-brand" />
              {t('shell.assistantTitle')}
            </p>
            <p className="text-caption text-ink-muted">{t('shell.assistantBody')}</p>
            <Link
              to={paths.assistant}
              onClick={onNavigate}
              className="rounded-lg bg-brand py-2 text-center text-small font-semibold text-on-brand hover:bg-brand-strong"
            >
              {t('shell.assistantCta')}
            </Link>
          </div>
        )}
        <p className="px-3 text-caption text-ink-muted">
          <PlanLine user={user} />
        </p>
      </div>
    </nav>
  )
}
