import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'

const TABS = [
  ['counts', paths.stockCounts],
  ['damage', paths.stockDamage],
  ['movements', paths.movements],
] as const

/** The three stock screens side by side: count, damage, and the log of every movement. */
export function StockTabs() {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('stock.sections')} className="flex gap-1 border-b border-border">
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
          {t(`stock.tabs.${key}`)}
        </NavLink>
      ))}
    </nav>
  )
}
