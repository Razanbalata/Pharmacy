import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'

const TABS = [
  ['shifts', paths.shifts],
  ['expenses', paths.expenses],
] as const

/** The two money screens side by side: the shift log and the expenses. */
export function FinanceTabs() {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('finance.sections')} className="flex gap-1 border-b border-border">
      {TABS.map(([key, path]) => (
        <NavLink
          key={key}
          to={path}
          end
          className={({ isActive }) =>
            cn(
              '-mb-px border-b-2 px-3 py-2.5 text-body',
              isActive
                ? 'border-brand font-semibold text-brand-strong'
                : 'border-transparent text-ink-muted hover:text-ink',
            )
          }
        >
          {t(`finance.tabs.${key}`)}
        </NavLink>
      ))}
    </nav>
  )
}
