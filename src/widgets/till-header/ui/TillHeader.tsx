import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/entities/session'
import { shiftQueries } from '@/entities/shift'
import { paths } from '@/shared/config'

/**
 * The dark bar over the till screens: pharmacy, open sales, the shift, who is selling,
 * and the way out. The till has no sidebar, so the screen is all for selling.
 */
export function TillHeader({ children }: { children?: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { data: user } = useCurrentUser()
  const { data: current } = useQuery(shiftQueries.current())
  const shift = current?.shift
  const time = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  })

  return (
    <header className="flex flex-wrap items-center gap-4 bg-navy px-4 py-2.5 text-on-navy">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-md bg-brand font-display text-on-brand"
        >
          ف
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-display text-body-strong">{t('app.name')}</span>
          {user && 'pharmacy' in user && (
            <span className="text-caption opacity-70">{user.pharmacy.name}</span>
          )}
        </span>
      </div>
      <div className="flex grow flex-wrap items-center gap-2">{children}</div>
      {shift && (
        <span className="flex items-center gap-2 text-small">
          <span aria-hidden className="size-2 rounded-pill bg-success" />
          {t('pos.shiftOpen', {
            number: shift.number,
            time: time.format(new Date(shift.openedAt)),
          })}
          <Link to={paths.shift} className="underline opacity-80 hover:opacity-100">
            {t('pos.closeShift')}
          </Link>
        </span>
      )}
      {user && 'pharmacy' in user && (
        <span className="text-small opacity-80">
          {user.name} · {t(`role.${user.role}`)}
        </span>
      )}
      <Link
        to={paths.dashboard}
        className="rounded-md border border-on-navy/30 px-3 py-1.5 text-small hover:bg-navy-soft"
      >
        {t('pos.exit')}
      </Link>
    </header>
  )
}
