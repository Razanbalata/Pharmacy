import type { CurrentUser } from '@/entities/session'

/**
 * Fake data that matches the design screens, so what we build looks like the design.
 * Same names and numbers as the design: صيدلية الشفاء, رزان the manager, 18 trial days left.
 */
export const users = {
  manager: {
    id: 1,
    name: 'رزان',
    phone: '0599920307',
    role: 'manager',
    discountLimit: null,
    pharmacy: { id: 1, name: 'صيدلية الشفاء', plan: 'trial', planEndsAt: '2026-12-12' },
  },
  pharmacist: {
    id: 2,
    name: 'سارة يوسف',
    phone: '0598210774',
    role: 'pharmacist',
    discountLimit: 10,
    pharmacy: { id: 1, name: 'صيدلية الشفاء', plan: 'trial', planEndsAt: '2026-12-12' },
  },
  cashier: {
    id: 3,
    name: 'محمد سالم',
    phone: '0597640118',
    role: 'cashier',
    discountLimit: 5,
    pharmacy: { id: 1, name: 'صيدلية الشفاء', plan: 'trial', planEndsAt: '2026-12-12' },
  },
} satisfies Record<string, CurrentUser>

/** Which fake user is signed in. Change it in the browser console: localStorage.mockRole = 'cashier' */
export function mockRole(): keyof typeof users {
  const saved = globalThis.localStorage?.getItem('mockRole')
  return saved === 'pharmacist' || saved === 'cashier' ? saved : 'manager'
}
