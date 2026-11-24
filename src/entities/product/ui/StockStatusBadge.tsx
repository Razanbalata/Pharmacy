import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui/badge'
import type { StockStatus } from '../model/types'

const TONE = {
  ok: 'success',
  low: 'warning',
  soon: 'warning',
  out: 'neutral',
  expired: 'danger',
} as const

/** The product's state in words. A stopped product says so whatever its stock. */
export function StockStatusBadge({ status, active }: { status: StockStatus; active: boolean }) {
  const { t } = useTranslation()
  if (!active) return <Badge tone="neutral">{t('products.status.stopped')}</Badge>
  return <Badge tone={TONE[status]}>{t(`products.status.${status}`)}</Badge>
}
