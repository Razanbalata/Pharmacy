import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router'
import { useAlertSummary } from '@/entities/alert'
import { navigationFor, type CurrentUser } from '@/entities/session'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { daysUntil } from '@/shared/lib/date'

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

/** The dark menu on the start side. Shows only what the user's role may open. */
export function Sidebar({ user, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  const { data: alerts } = useAlertSummary()
  const groups = navigationFor(user.role)

  return (
    <nav
      aria-label={t('nav.main')}
      className="flex h-full min-h-0 flex-col gap-1 bg-navy px-3.5 py-5 text-on-navy"
    >
      <Link
        to={paths.dashboard}
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2 pb-4"
      >
        <span className="flex size-9 items-center justify-center rounded-md bg-brand font-display text-subheading text-on-brand">
          ف
        </span>
        <span className="flex flex-col">
          <span className="font-display text-body-strong">{t('app.name')}</span>
          <span className="text-caption opacity-70">{user.pharmacy.name}</span>
        </span>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.title ?? 'top'} className="flex flex-col gap-0.5">
            {group.title && (
              <p className="px-3 pt-4 pb-1 text-caption opacity-60">
                {t(`nav.groups.${group.title}`)}
              </p>
            )}
            {group.items.map((item) => {
              const count = item.key === 'alerts' && alerts?.unread ? alerts.unread : null
              return (
                <NavLink
                  key={item.key}
                  to={paths[item.key]}
                  end={item.key === 'dashboard'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-md px-3 py-2 text-body transition-colors',
                      isActive ? 'bg-brand font-semibold text-on-brand' : 'hover:bg-navy-soft',
                    )
                  }
                >
                  <span>{t(`nav.${item.key}`)}</span>
                  {count !== null && (
                    <span className="tabular rounded-pill bg-warning px-2 text-caption text-navy">
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
          <div className="flex flex-col gap-2 rounded-lg border border-navy-soft bg-navy-soft/50 p-3.5">
            <p className="font-display text-small font-semibold">
              <span aria-hidden className="text-brand">
                ✦{' '}
              </span>
              {t('shell.assistantTitle')}
            </p>
            <p className="text-caption opacity-70">{t('shell.assistantBody')}</p>
            <Link
              to={paths.assistant}
              onClick={onNavigate}
              className="rounded-md bg-brand py-2 text-center text-small font-semibold text-on-brand"
            >
              {t('shell.assistantCta')}
            </Link>
          </div>
        )}
        <p className="px-3 text-caption opacity-70">
          <PlanLine user={user} />
        </p>
      </div>
    </nav>
  )
}
