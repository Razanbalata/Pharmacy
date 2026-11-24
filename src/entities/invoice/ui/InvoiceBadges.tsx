import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui/badge'
import type { InvoiceStatus, SalePaymentMethod } from '../model/types'

const STATUS_TONE = {
  completed: 'success',
  partlyReturned: 'warning',
  returned: 'neutral',
} as const
const METHOD_TONE = { cash: 'neutral', bank: 'info', credit: 'warning', mixed: 'brand' } as const

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation()
  return <Badge tone={STATUS_TONE[status]}>{t(`invoices.statuses.${status}`)}</Badge>
}

export function PaymentMethodBadge({ method }: { method: SalePaymentMethod }) {
  const { t } = useTranslation()
  return <Badge tone={METHOD_TONE[method]}>{t(`payment.methods.${method}`)}</Badge>
}
