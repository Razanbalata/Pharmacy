import type { Plan, SubscriptionEvent } from '@/entities/platform/pharmacy'
import type { SubscriptionPayment } from '@/entities/platform/subscription'

export interface StoredPharmacy {
  id: number
  name: string
  owner: string
  phone: string
  city: string
  district: string
  license: string
  plan: Plan
  status: 'active' | 'suspended'
  endsAt: string
  /** For every pharmacy but ours, the usage numbers are kept as they are. */
  usage: {
    products: number
    staff: { total: number; active: number }
    invoicesToday: number
    lastActiveAt: string
    onboardingDone: boolean
  } | null
  registeredAt: string
  supportAccess: 'none' | 'requested' | 'granted'
  history: SubscriptionEvent[]
}

/** A small picture standing in for the photo of a transfer receipt. */
function receipt(text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="#f4f7f7"/><text x="50%" y="50%" font-size="18" text-anchor="middle" font-family="sans-serif">${text}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** The pharmacies on the platform and their payments, as in the design. */
export function initialPlatform() {
  const started = (at: string): SubscriptionEvent[] => [
    { kind: 'joined', at, params: {} },
    { kind: 'trialStarted', at, params: { days: 30 } },
  ]
  const pharmacy = (
    id: number,
    name: string,
    owner: string,
    phone: string,
    city: string,
    district: string,
    plan: Plan,
    endsAt: string,
    registeredAt: string,
    usage: StoredPharmacy['usage'],
    extra: Partial<StoredPharmacy> = {},
  ): StoredPharmacy => ({
    id,
    name,
    owner,
    phone,
    city,
    district,
    license: `PH-${registeredAt.slice(0, 4)}-${String(100 + id * 47).padStart(4, '0')}`,
    plan,
    status: 'active',
    endsAt,
    usage,
    registeredAt,
    supportAccess: 'none',
    history: started(`${registeredAt}T09:00:00Z`),
    ...extra,
  })
  // Activity is shown against the real clock, so it is counted back from now.
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

  const pharmacies: StoredPharmacy[] = [
    // Ours: its usage is read live from the app's own data.
    pharmacy(
      1,
      'صيدلية الشفاء',
      'رزان بلاطة',
      '0599920307',
      'غزة',
      'الرمال',
      'trial',
      '2026-12-12',
      '2026-11-11',
      null,
      {
        license: 'PH-2026-0147',
      },
    ),
    pharmacy(
      2,
      'صيدلية النور',
      'خالد حمدان',
      '0598114520',
      'خان يونس',
      'المحطة',
      'pro',
      '2026-11-27',
      '2026-08-27',
      {
        products: 540,
        staff: { total: 6, active: 5 },
        invoicesToday: 61,
        lastActiveAt: ago(10),
        onboardingDone: true,
      },
    ),
    pharmacy(
      3,
      'صيدلية الحياة',
      'منى عاشور',
      '0597330812',
      'دير البلح',
      'البلد',
      'basic',
      '2026-11-29',
      '2026-09-29',
      {
        products: 205,
        staff: { total: 2, active: 2 },
        invoicesToday: 0,
        lastActiveAt: ago(60 * 20),
        onboardingDone: true,
      },
    ),
    pharmacy(
      4,
      'صيدلية الأمل',
      'سامي الكرد',
      '0592771046',
      'غزة',
      'تل الهوا',
      'yearly',
      '2027-09-28',
      '2026-08-29',
      {
        products: 870,
        staff: { total: 9, active: 8 },
        invoicesToday: 95,
        lastActiveAt: ago(60),
        onboardingDone: true,
      },
    ),
    pharmacy(
      5,
      'صيدلية الهدى',
      'سهام قديح',
      '0599402870',
      'النصيرات',
      'السوق',
      'trial',
      '2026-12-20',
      '2026-11-20',
      {
        products: 0,
        staff: { total: 1, active: 1 },
        invoicesToday: 0,
        lastActiveAt: ago(60 * 24 * 4),
        onboardingDone: false,
      },
    ),
    pharmacy(
      6,
      'صيدلية بلسم',
      'عمر زقوت',
      '0595638007',
      'غزة',
      'الشيخ رضوان',
      'pro',
      '2027-01-15',
      '2026-09-15',
      {
        products: 415,
        staff: { total: 3, active: 3 },
        invoicesToday: 40,
        lastActiveAt: ago(120),
        onboardingDone: true,
      },
    ),
    pharmacy(
      7,
      'صيدلية السلام',
      'ياسر شعث',
      '0598250913',
      'رفح',
      'الشابورة',
      'basic',
      '2026-11-10',
      '2026-09-10',
      {
        products: 330,
        staff: { total: 2, active: 0 },
        invoicesToday: 0,
        lastActiveAt: ago(60 * 24 * 13),
        onboardingDone: true,
      },
      { status: 'suspended' },
    ),
  ]
  // What happened since each paid pharmacy's trial.
  const paid = (id: number, plan: Plan, at: string, until: string) =>
    pharmacies
      .find((item) => item.id === id)
      ?.history.push({ kind: 'paymentConfirmed', at, params: { plan, until } })
  paid(2, 'pro', '2026-09-26T10:00:00Z', '2026-10-27')
  paid(2, 'pro', '2026-10-26T10:00:00Z', '2026-11-27')
  paid(3, 'basic', '2026-10-29T10:00:00Z', '2026-11-29')
  paid(4, 'yearly', '2026-09-28T10:00:00Z', '2027-09-28')
  paid(6, 'pro', '2026-11-15T10:00:00Z', '2027-01-15')
  paid(7, 'basic', '2026-10-10T10:00:00Z', '2026-11-10')
  pharmacies
    .find((item) => item.id === 7)
    ?.history.push({
      kind: 'suspended',
      at: '2026-11-11T08:00:00Z',
      params: { reason: 'انتهى الاشتراك وما انجدد', by: 'المنصة' },
    })

  const payment = (
    id: number,
    date: string,
    pharmacyId: number,
    plan: SubscriptionPayment['plan'],
    method: string,
    status: SubscriptionPayment['status'],
    rejectionReason: string | null = null,
  ): SubscriptionPayment => ({
    id,
    date,
    pharmacy: {
      id: pharmacyId,
      name: pharmacies.find((item) => item.id === pharmacyId)?.name ?? '',
    },
    plan,
    amount: null,
    method,
    receiptUrl: receipt(`إيصال ${id}`),
    status,
    rejectionReason,
  })
  const payments: SubscriptionPayment[] = [
    payment(5, '2026-11-23', 2, 'pro', 'تحويل بنك فلسطين', 'pending'),
    payment(4, '2026-11-22', 3, 'basic', 'جوال باي', 'pending'),
    payment(3, '2026-11-15', 6, 'pro', 'جوال باي', 'confirmed'),
    payment(2, '2026-11-03', 7, 'basic', 'تحويل بنك فلسطين', 'rejected', 'الإيصال مش واضح'),
    payment(1, '2026-09-28', 4, 'yearly', 'تحويل بنك فلسطين', 'confirmed'),
  ]
  const planPrices: Record<'basic' | 'pro' | 'yearly', number | null> = {
    basic: null,
    pro: null,
    yearly: null,
  }
  return { platformPharmacies: pharmacies, subscriptionPayments: payments, planPrices }
}
