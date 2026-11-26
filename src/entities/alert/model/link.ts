import { paths, to } from '@/shared/config'
import type { Alert } from './types'

export type AlertAction =
  | 'damage'
  | 'product'
  | 'viewAll'
  | 'openOrder'
  | 'reviewOrders'
  | 'statement'
  | 'receive'
  | 'receiveRest'
  | 'plan'

/** Where the alert's button goes: the screen that fixes the problem. */
export function alertLink(alert: Alert): { href: string; action: AlertAction } {
  switch (alert.kind) {
    case 'expiredInStock':
      return { href: paths.stockDamage, action: 'damage' }
    case 'expiringSoon':
      return { href: to(paths.productDetail, { id: alert.params.productId }), action: 'product' }
    case 'expiringMore':
      return { href: `${paths.products}?tab=soon`, action: 'viewAll' }
    case 'lowUrgent':
      return alert.params.draft
        ? { href: to(paths.purchaseDetail, { id: alert.params.draft.id }), action: 'openOrder' }
        : { href: paths.purchases, action: 'reviewOrders' }
    case 'lowMore':
      return { href: paths.purchases, action: 'reviewOrders' }
    case 'debtOverLimit':
    case 'debtLate':
      return {
        href: to(paths.customerDetail, { id: alert.params.customerId }),
        action: 'statement',
      }
    case 'orderSent':
      return { href: to(paths.purchaseReceive, { id: alert.params.orderId }), action: 'receive' }
    case 'orderPartial':
      return {
        href: to(paths.purchaseReceive, { id: alert.params.orderId }),
        action: 'receiveRest',
      }
    case 'trialEnding':
      return { href: paths.settings, action: 'plan' }
  }
}
