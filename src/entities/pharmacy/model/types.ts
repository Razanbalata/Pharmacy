/** The pharmacy's own details, shown on receipts and invoices. */
export interface PharmacyProfile {
  id: number
  name: string
  city: string
  address: string
  phone: string
  licenseNumber: string
  currency: 'ILS'
  logoUrl: string | null
}

export type PharmacyProfileInput = Omit<PharmacyProfile, 'id' | 'logoUrl'>

/** How the manager wants to fill the pharmacy at the start. */
export type StartMethod = 'excel' | 'catalog' | 'sample' | 'empty'

export const ONBOARDING_STEPS = [
  'account',
  'profile',
  'products',
  'openingStock',
  'staff',
  'payments',
] as const
export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]

export interface OnboardingStatus {
  steps: { key: OnboardingStepKey; done: boolean }[]
  dismissed: boolean
}
