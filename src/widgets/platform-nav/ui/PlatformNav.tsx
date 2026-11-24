import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'

const ITEMS = ['platformRequests', 'platformPharmacies', 'platformBilling'] as const

/** The platform owner's menu. Purple, so it is never mixed up with a pharmacy's screens. */
export function PlatformNav({ footer }: { footer?: ReactNode }) {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('platform.name')}
      className="flex h-full flex-col gap-1.5 bg-platform px-3.5 py-5 text-white"
    >
      <div className="flex items-center gap-2.5 px-2 pb-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-brand font-display font-bold text-on-brand">
          ف
        </span>
        <span className="flex flex-col">
          <span className="font-display text-body-strong">{t('app.name')}</span>
          <span className="text-caption text-platform-muted">{t('platform.name')}</span>
        </span>
      </div>
      {ITEMS.map((key) => (
        <NavLink
          key={key}
          to={paths[key]}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-2.5 text-body',
              isActive ? 'bg-platform-accent font-semibold' : 'hover:bg-white/10',
            )
          }
        >
          {t(`nav.${key}`)}
        </NavLink>
      ))}
      <div className="mt-auto flex flex-col gap-3 px-2">
        {footer}
        <p className="text-caption text-platform-muted/80">{t('platform.note')}</p>
      </div>
    </nav>
  )
}
