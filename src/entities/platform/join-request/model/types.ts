export type JoinRequestStatus = 'new' | 'approved' | 'activated' | 'rejected'

/** What a pharmacy sends when it asks to join. No account exists yet at this point. */
export interface JoinRequestInput {
  pharmacyName: string
  ownerName: string
  city: string
  /** WhatsApp number; the activation link goes here. */
  phone: string
  licenseNumber: string
}

export interface JoinRequest extends JoinRequestInput {
  id: number
  /** Shown to the pharmacy after sending, e.g. REQ-0031. */
  reference: string
  status: JoinRequestStatus
  hasLicensePhoto: boolean
  /** Filled when rejected; sent to the owner. */
  rejectionReason: string | null
  createdAt: string
}

/** What the activation link shows before the owner picks a password. */
export interface ActivationInfo {
  pharmacyName: string
  ownerName: string
  phone: string
}
