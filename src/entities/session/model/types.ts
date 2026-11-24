/** The three roles inside a pharmacy. */
export const ROLES = ['manager', 'pharmacist', 'cashier'] as const
export type Role = (typeof ROLES)[number]

export interface PharmacySummary {
  id: number
  name: string
  /** Trial or paid plan; drives the "days left" line in the sidebar. */
  plan: 'trial' | 'basic' | 'pro' | 'yearly'
  /** ISO date the trial or subscription ends. */
  planEndsAt: string
  /** False until the manager finishes or hides the getting-started checklist. */
  onboardingDone: boolean
}

/** Someone who works in a pharmacy. */
export interface CurrentUser {
  id: number
  name: string
  phone: string
  role: Role
  /** Highest discount this user may give on one invoice, in percent. null = no limit (manager). */
  discountLimit: number | null
  /** The extras the manager gave this person (see staff). The manager has them all. */
  permissions: { sellOnCredit: boolean; seePurchasePrice: boolean; approveCounts: boolean }
  pharmacy: PharmacySummary
}

/** The owner of the whole platform. Has no pharmacy and its own screens under /platform. */
export interface PlatformUser {
  id: number
  name: string
  phone: string
  role: 'platform_owner'
}

export type SessionUser = CurrentUser | PlatformUser

export function isPlatformOwner(user: SessionUser): user is PlatformUser {
  return user.role === 'platform_owner'
}
