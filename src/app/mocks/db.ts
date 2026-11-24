import type { JoinRequest } from '@/entities/join-request'
import type { OnboardingStatus, PharmacyProfile } from '@/entities/pharmacy'

/**
 * The fake server's memory. Starts from the design data and changes as you use the app,
 * until the page is reloaded. reset() puts it back, so every test starts the same.
 */
function initial() {
  const joinRequests: JoinRequest[] = [
    {
      id: 34,
      reference: 'REQ-0034',
      pharmacyName: 'صيدلية الرحمة',
      ownerName: 'هبة نصار',
      city: 'النصيرات',
      phone: '0599402219',
      licenseNumber: 'PH-2025-0388',
      status: 'new',
      hasLicensePhoto: true,
      rejectionReason: null,
      createdAt: '2026-11-24T08:40:00Z',
    },
    {
      id: 33,
      reference: 'REQ-0033',
      pharmacyName: 'صيدلية الوفاء',
      ownerName: 'إياد مقداد',
      city: 'خان يونس',
      phone: '0597118640',
      licenseNumber: 'PH-2024-0912',
      status: 'new',
      hasLicensePhoto: false,
      rejectionReason: null,
      createdAt: '2026-11-23T14:10:00Z',
    },
    {
      id: 32,
      reference: 'REQ-0032',
      pharmacyName: 'صيدلية ابن سينا',
      ownerName: 'ريم أبو شمالة',
      city: 'غزة',
      phone: '0598503772',
      licenseNumber: 'PH-2026-0077',
      status: 'new',
      hasLicensePhoto: true,
      rejectionReason: null,
      createdAt: '2026-11-23T09:25:00Z',
    },
    {
      id: 30,
      reference: 'REQ-0030',
      pharmacyName: 'صيدلية الحكمة',
      ownerName: 'ناصر الدحدوح',
      city: 'دير البلح',
      phone: '0592660135',
      licenseNumber: 'PH-2023-0451',
      status: 'approved',
      hasLicensePhoto: true,
      rejectionReason: null,
      createdAt: '2026-11-22T11:00:00Z',
    },
    {
      id: 31,
      reference: 'REQ-0031',
      pharmacyName: 'صيدلية الشفاء',
      ownerName: 'رزان بلاطة',
      city: 'غزة',
      phone: '0599920307',
      licenseNumber: 'PH-2026-0147',
      status: 'activated',
      hasLicensePhoto: true,
      rejectionReason: null,
      createdAt: '2026-11-11T07:30:00Z',
    },
    {
      id: 29,
      reference: 'REQ-0029',
      pharmacyName: 'صيدلية المدينة',
      ownerName: 'عماد سرحان',
      city: 'رفح',
      phone: '0595207918',
      licenseNumber: 'PH-2022-0310',
      status: 'rejected',
      hasLicensePhoto: true,
      rejectionReason: 'الترخيص مش مطابق لاسم الصيدلية',
      createdAt: '2026-11-20T10:15:00Z',
    },
  ]
  const profile: PharmacyProfile = {
    id: 1,
    name: 'صيدلية الشفاء',
    city: 'غزة',
    address: 'الرمال · شارع عمر المختار',
    phone: '0599123456',
    licenseNumber: 'PH-2026-0147',
    currency: 'ILS',
    logoUrl: null,
  }
  const onboarding: OnboardingStatus = {
    dismissed: false,
    steps: [
      { key: 'account', done: true },
      { key: 'profile', done: true },
      { key: 'products', done: false },
      { key: 'openingStock', done: false },
      { key: 'staff', done: false },
      { key: 'payments', done: false },
    ],
  }
  return {
    joinRequests,
    profile,
    onboarding,
    cities: [
      'غزة',
      'خان يونس',
      'دير البلح',
      'رفح',
      'النصيرات',
      'البريج',
      'المغازي',
      'جباليا',
      'بيت لاهيا',
      'بيت حانون',
    ],
    /** activation token → join request id. "expired-token" is known but too old. */
    activationTokens: new Map<string, { requestId: number; expired: boolean }>([
      ['demo-token', { requestId: 30, expired: false }],
      ['expired-token', { requestId: 30, expired: true }],
    ]),
    failedLogins: 0,
    /** Password reset: the code that "was sent", and the token after verifying it. */
    resetCode: '481927',
    resetTokens: new Set<string>(),
  }
}

export let db = initial()

export function resetDb(): void {
  db = initial()
}
