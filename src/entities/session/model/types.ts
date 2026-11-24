/** The three roles inside a pharmacy. The platform owner is separate and not a pharmacy role. */
export const ROLES = ['manager', 'pharmacist', 'cashier'] as const
export type Role = (typeof ROLES)[number]

export interface PharmacySummary {
  id: number
  name: string
  /** Trial or paid plan; drives the "days left" line in the sidebar. */
  plan: 'trial' | 'basic' | 'pro' | 'yearly'
  /** ISO date the trial or subscription ends. */
  planEndsAt: string
}

export interface CurrentUser {
  id: number
  name: string
  phone: string
  role: Role
  /** Highest discount this user may give on one invoice, in percent. null = no limit (manager). */
  discountLimit: number | null
  pharmacy: PharmacySummary
}
