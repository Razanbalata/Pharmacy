import type { TFunction } from 'i18next'
import type { PlatformPharmacy } from './types'
import { daysUntil } from '@/shared/lib/date'

/** "In 3 days", "Today", or "Ended 10/11", from the real calendar. */
export function endsText(
  pharmacy: Pick<PlatformPharmacy, 'endsAt'>,
  t: TFunction,
  date: Intl.DateTimeFormat,
) {
  const days = daysUntil(pharmacy.endsAt)
  if (days < 0)
    return {
      text: t('tenants.ended', { date: date.format(new Date(pharmacy.endsAt)) }),
      soon: true,
    }
  if (days === 0) return { text: t('tenants.endsToday'), soon: true }
  if (days <= 31) return { text: t('tenants.endsIn', { count: days }), soon: days <= 7 }
  return { text: date.format(new Date(pharmacy.endsAt)), soon: false }
}

/** "Now", "10 min ago", "2 h ago", "4 days ago". */
export function lastActiveText(iso: string, t: TFunction, now: number) {
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000))
  if (minutes < 2) return t('tenants.now')
  if (minutes < 60) return t('tenants.minutes', { count: minutes })
  if (minutes < 60 * 24) return t('tenants.hours', { count: Math.round(minutes / 60) })
  return t('tenants.days', { count: Math.round(minutes / 60 / 24) })
}
