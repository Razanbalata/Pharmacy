import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { daysUntil, formatMonthYear, monthsUntil } from '@/shared/lib/date'

/** "09/2027" and under it how far that is: "in 10 months", "in 5 days", "expired a month ago". */
export function ExpiryInfo({ date }: { date: string | null }) {
  const { t } = useTranslation()
  if (!date) return <span className="text-ink-muted">—</span>

  const days = daysUntil(date)
  const months = monthsUntil(date)
  const relative =
    days < 0
      ? t('products.expiry.expiredAgo', { count: Math.max(1, -months) })
      : months === 0
        ? t('products.expiry.inDays', { count: days })
        : t('products.expiry.inMonths', { count: months })

  return (
    <span className="flex flex-col">
      <span className="tabular">{formatMonthYear(date)}</span>
      <span className={cn('text-caption', days < 0 ? 'text-danger' : 'text-ink-muted')}>
        {relative}
      </span>
    </span>
  )
}
