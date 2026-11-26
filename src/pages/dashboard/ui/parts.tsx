import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/entities/session'

/** "Good evening, Razan" and today's date, from the real clock. */
export function Greeting({ children }: { children?: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { data: user } = useCurrentUser()
  const [now] = useState(() => new Date())
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    numberingSystem: 'latn',
  })
  const name = user?.name.split(' ')[0] ?? ''
  return (
    <div>
      <h1 className="font-display text-display">
        {now.getHours() < 12
          ? t('dashboard.greeting.morning', { name })
          : t('dashboard.greeting.evening', { name })}
      </h1>
      <p className="mt-1 text-body text-ink-muted">
        {date.format(now)}
        {children ? <> · {children}</> : null}
      </p>
    </div>
  )
}
