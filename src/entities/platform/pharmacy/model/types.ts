export const PLANS = ['trial', 'basic', 'pro', 'yearly'] as const
export type Plan = (typeof PLANS)[number]

/**
 * A pharmacy as the platform owner sees it: who runs it, the plan, and how much it is used.
 * Counts only: its sales, profit and customers stay the pharmacy's own.
 */
export interface PlatformPharmacy {
  id: number
  name: string
  owner: string
  phone: string
  city: string
  district: string
  license: string
  plan: Plan
  status: 'active' | 'suspended'
  /** When the trial or the paid plan ends. */
  endsAt: string
  products: number
  staff: { total: number; active: number }
  invoicesToday: number
  lastActiveAt: string
  onboardingDone: boolean
  registeredAt: string
  /** Pending until the owner allows it; then support may open the pharmacy for a while. */
  supportAccess: 'none' | 'requested' | 'granted'
}

export const PHARMACY_FILTERS = ['all', 'trial', 'paid', 'suspended'] as const
export type PharmacyFilter = (typeof PHARMACY_FILTERS)[number]

export interface PharmacyList {
  data: PlatformPharmacy[]
  summary: {
    paid: number
    trial: number
    /** Active pharmacies whose plan ends within seven days. */
    endingThisWeek: number
    suspended: number
    counts: Record<PharmacyFilter, number>
    cities: string[]
  }
}

export type SubscriptionEvent =
  | { kind: 'joined'; at: string; params: Record<string, never> }
  | { kind: 'trialStarted'; at: string; params: { days: number } }
  | { kind: 'trialExtended'; at: string; params: { days: number; by: string } }
  | { kind: 'planChanged'; at: string; params: { plan: Plan; until: string; by: string } }
  | { kind: 'paymentConfirmed'; at: string; params: { plan: Plan; until: string } }
  | { kind: 'paymentRejected'; at: string; params: { reason: string } }
  | { kind: 'suspended'; at: string; params: { reason: string; by: string } }
  | { kind: 'resumed'; at: string; params: { by: string } }
  | { kind: 'supportRequested'; at: string; params: { by: string } }
  | { kind: 'ends'; at: string; params: { plan: Plan } }

export interface PharmacyDetail extends PlatformPharmacy {
  /** Oldest first; the last line is when the current plan ends. */
  history: SubscriptionEvent[]
}
