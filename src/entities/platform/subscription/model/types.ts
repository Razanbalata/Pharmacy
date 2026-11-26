/** The plans a pharmacy pays for; the trial is free. */
export type PaidPlan = 'basic' | 'pro' | 'yearly'

export interface PlanInfo {
  key: PaidPlan
  /** Null until the owner sets it. */
  price: number | null
  per: 'month' | 'year'
  /** How many pharmacies are on it now. */
  pharmacies: number
}

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected'

/**
 * Payments are by hand: the pharmacy transfers the money and sends a photo of the receipt;
 * the owner checks it and confirms, and the plan starts.
 */
export interface SubscriptionPayment {
  id: number
  date: string
  pharmacy: { id: number; name: string }
  plan: PaidPlan
  amount: number | null
  method: string
  receiptUrl: string | null
  status: PaymentStatus
  rejectionReason: string | null
}

export interface Billing {
  plans: PlanInfo[]
  payments: SubscriptionPayment[]
  pending: number
}
