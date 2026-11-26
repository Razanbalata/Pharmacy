import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import type { PlatformPharmacy } from '../model/types'

const TONE = {
  trial: 'bg-warning-soft text-warning',
  basic: 'bg-surface-200 text-ink',
  pro: 'bg-brand-soft text-brand-strong',
  yearly: 'bg-platform-soft text-platform-accent',
  suspended: 'bg-danger-soft text-danger',
} as const

/** The plan, or "Suspended" in red when the pharmacy is stopped. */
export function PlanBadge({ pharmacy }: { pharmacy: Pick<PlatformPharmacy, 'plan' | 'status'> }) {
  const { t } = useTranslation()
  const suspended = pharmacy.status === 'suspended'
  return (
    <span
      className={cn(
        'rounded-pill px-2.5 py-0.5 text-caption',
        TONE[suspended ? 'suspended' : pharmacy.plan],
      )}
    >
      {suspended ? t('tenants.stopped') : t(`tenants.plans.${pharmacy.plan}`)}
    </span>
  )
}
