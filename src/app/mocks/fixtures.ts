import type { CurrentUser, PlatformUser, SessionUser } from '@/entities/session'

/**
 * Fake data that matches the design screens, so what we build looks like the design.
 * Same names and numbers as the design: صيدلية الشفاء, رزان the manager, 18 trial days left.
 */
const pharmacy: CurrentUser['pharmacy'] = {
  id: 1,
  name: 'صيدلية الشفاء',
  plan: 'trial',
  planEndsAt: '2026-12-12',
  onboardingDone: false,
}

export const users = {
  manager: {
    id: 1,
    name: 'رزان',
    phone: '0599920307',
    role: 'manager',
    discountLimit: null,
    pharmacy,
  },
  pharmacist: {
    id: 2,
    name: 'سارة يوسف',
    phone: '0598210774',
    role: 'pharmacist',
    discountLimit: 10,
    pharmacy,
  },
  cashier: {
    id: 3,
    name: 'محمد سالم',
    phone: '0597640118',
    role: 'cashier',
    discountLimit: 5,
    pharmacy,
  },
  platform: {
    id: 100,
    name: 'رزان بلاطة',
    phone: '0590000000',
    role: 'platform_owner',
  } satisfies PlatformUser,
} satisfies Record<string, SessionUser>

export type MockRole = keyof typeof users

/** The one password every fake account accepts. */
export const MOCK_PASSWORD = 'Pharma2026x'

/**
 * Who is signed in to the fake server. Kept in the browser so a reload keeps the session.
 * Switch from the console: localStorage.mockRole = 'cashier' (or 'none' to sign out).
 */
export function mockRole(): MockRole | null {
  const saved = globalThis.localStorage?.getItem('mockRole')
  if (saved === 'none') return null
  if (saved === 'pharmacist' || saved === 'cashier' || saved === 'platform') return saved
  return 'manager'
}

export function setMockRole(role: MockRole | null): void {
  globalThis.localStorage?.setItem('mockRole', role ?? 'none')
}
