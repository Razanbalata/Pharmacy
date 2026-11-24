import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui/badge'
import type { OrderPaymentStatus, OrderStatus } from '../model/types'

const ORDER_TONE = {
  draft: 'neutral',
  sent: 'info',
  partial: 'warning',
  received: 'success',
  cancelled: 'danger',
} as const

const PAYMENT_TONE = {
  unpaid: 'danger',
  partial: 'warning',
  paid: 'success',
} as const

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  return <Badge tone={ORDER_TONE[status]}>{t(`purchases.status.${status}`)}</Badge>
}

/** "—" before anything arrived: nothing is owed yet, so there is nothing to pay. */
export function PaymentStatusBadge({ status }: { status: OrderPaymentStatus }) {
  const { t } = useTranslation()
  if (status === 'none') return <span className="text-ink-muted">—</span>
  return <Badge tone={PAYMENT_TONE[status]}>{t(`purchases.payment.${status}`)}</Badge>
}
