export interface AlertSummary {
  /** Alerts the user has not opened yet; the number on the bell. */
  unread: number
}

export const ALERT_GROUPS = ['expiry', 'shortage', 'debts', 'purchases', 'system'] as const
export type AlertGroup = (typeof ALERT_GROUPS)[number]

export type AlertSeverity = 'danger' | 'warning' | 'info' | 'neutral'

/**
 * Every alert the server raises. The server sends the kind and the numbers; the app words it,
 * so it reads right in Arabic and English, and knows which screen fixes it.
 */
export type AlertKind =
  | { kind: 'expiredInStock'; params: { batches: number; names: string } }
  | {
      kind: 'expiringSoon'
      params: { productId: number; name: string; days: number; batch: string; quantity: number }
    }
  | { kind: 'expiringMore'; params: { count: number; value: number } }
  | {
      kind: 'lowUrgent'
      params: {
        productId: number
        name: string
        quantity: number
        minStock: number
        /** A draft purchase order that already has it, to finish and send. */
        draft: { id: number; number: string } | null
      }
    }
  | { kind: 'lowMore'; params: { count: number } }
  | {
      kind: 'debtOverLimit'
      params: { customerId: number; name: string; debt: number; limit: number; days: number }
    }
  | { kind: 'debtLate'; params: { customerId: number; name: string; debt: number; days: number } }
  | {
      kind: 'orderSent'
      params: { orderId: number; number: string; supplier: string; items: number }
    }
  | { kind: 'orderPartial'; params: { orderId: number; number: string; supplier: string } }
  | { kind: 'trialEnding'; params: { days: number } }

export type Alert = AlertKind & {
  /** Stable for the same subject, e.g. "expiring:3", so read stays read. */
  id: string
  group: AlertGroup
  severity: AlertSeverity
  at: string
  read: boolean
  /** How many things it covers (batches, products, customers), for the group counts. */
  count: number
}

export interface AlertList {
  data: Alert[]
  summary: {
    unread: number
    counts: Record<AlertGroup | 'all', number>
    /** Days before expiry an alert is raised, from the settings. */
    expiryAlertDays: number
  }
}
