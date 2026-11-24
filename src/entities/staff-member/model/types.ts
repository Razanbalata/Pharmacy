import type { Role } from '@/entities/session/@x/staff-member'

export interface StaffPermissions {
  sellOnCredit: boolean
  seePurchasePrice: boolean
  /** Pharmacists only: approve stock count differences. */
  approveCounts: boolean
}

export interface StaffMember {
  id: number
  name: string
  phone: string
  email: string | null
  role: Role
  /** Percent; null means no limit (the manager). */
  discountLimit: number | null
  permissions: StaffPermissions
  active: boolean
  /** The pharmacy's owner: one per pharmacy, cannot be stopped or edited here. */
  isOwner: boolean
  lastLoginAt: string | null
}

/** Staff are added as pharmacist or cashier; there is only one manager, the owner. */
export type StaffRole = Exclude<Role, 'manager'>

export interface StaffInput {
  name: string
  phone: string
  email: string | null
  role: StaffRole
  discountLimit: number
  permissions: StaffPermissions
}

/** Returned once when a member is added or their password is reset; never stored by us. */
export interface TemporaryPassword {
  temporaryPassword: string
}
