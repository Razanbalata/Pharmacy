import { http, HttpResponse } from 'msw'
import type { PharmacyDetail, PharmacyFilter, PlatformPharmacy } from '@/entities/platform/pharmacy'
import type { Billing, PaidPlan } from '@/entities/platform/subscription'
import { matchesSearch } from '@/shared/lib/arabic-search'
import { daysUntil } from '@/shared/lib/date'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { mockRole, users } from '../fixtures'
import type { StoredPharmacy } from '../platform-data'

const notFound = () => HttpResponse.json({ message: 'Not found.' }, { status: 404 })
const invalid = (field: string, code: string) =>
  HttpResponse.json(
    { message: 'The given data was invalid.', errors: { [field]: [code] } },
    { status: 422 },
  )
const by = () => users.platform.name

/** Every platform screen is the platform owner's only. */
const owner = () => mockRole() === 'platform'
const forbidden = () => HttpResponse.json({ message: 'Forbidden.' }, { status: 403 })

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(year, month - 1 + months, day)).toISOString().slice(0, 10)
}

/** Our own pharmacy's usage comes from the app's data; the others keep theirs. */
function view(item: StoredPharmacy): PlatformPharmacy {
  const { usage, history: _history, ...rest } = item
  const live =
    usage ??
    ({
      products: db.products.length,
      staff: {
        total: db.staff.length,
        active: db.staff.filter((member) => member.active).length,
      },
      invoicesToday: db.invoices.filter((invoice) => invoice.at.slice(0, 10) === db.today).length,
      lastActiveAt: new Date().toISOString(),
      onboardingDone: db.onboarding.dismissed,
    } satisfies NonNullable<StoredPharmacy['usage']>)
  return { ...rest, ...live }
}

function detail(item: StoredPharmacy): PharmacyDetail {
  return {
    ...view(item),
    history: [
      ...item.history,
      { kind: 'ends', at: `${item.endsAt}T00:00:00Z`, params: { plan: item.plan } },
    ],
  }
}

const find = (id: unknown) => db.platformPharmacies.find((item) => item.id === Number(id))

function matches(item: StoredPharmacy, filter: PharmacyFilter): boolean {
  if (filter === 'trial') return item.status === 'active' && item.plan === 'trial'
  if (filter === 'paid') return item.status === 'active' && item.plan !== 'trial'
  if (filter === 'suspended') return item.status === 'suspended'
  return true
}

/** Plans run on the real calendar, like the days-left line a pharmacy sees. */
const today = () => new Date().toISOString().slice(0, 10)

export const platformHandlers = [
  http.get(apiUrl('/api/platform/pharmacies'), ({ request }) => {
    if (!owner()) return forbidden()
    const query = new URL(request.url).searchParams
    const filter = (query.get('filter') ?? 'all') as PharmacyFilter
    const city = query.get('city')
    const search = query.get('search') ?? ''
    const all = db.platformPharmacies
    const list = all
      .filter(
        (item) =>
          matches(item, filter) &&
          (!city || item.city === city) &&
          (!search || matchesSearch(`${item.name} ${item.owner} ${item.phone}`, search)),
      )
      // What ends soonest first; suspended ones last.
      .sort(
        (a, b) =>
          Number(a.status === 'suspended') - Number(b.status === 'suspended') ||
          a.endsAt.localeCompare(b.endsAt),
      )
      .map(view)
    const active = all.filter((item) => item.status === 'active')
    return HttpResponse.json({
      data: list,
      summary: {
        paid: active.filter((item) => item.plan !== 'trial').length,
        trial: active.filter((item) => item.plan === 'trial').length,
        endingThisWeek: active.filter((item) => {
          const days = daysUntil(item.endsAt)
          return days >= 0 && days <= 7
        }).length,
        suspended: all.length - active.length,
        counts: {
          all: all.length,
          trial: all.filter((item) => matches(item, 'trial')).length,
          paid: all.filter((item) => matches(item, 'paid')).length,
          suspended: all.filter((item) => matches(item, 'suspended')).length,
        },
        cities: [...new Set(all.map((item) => item.city))].sort((a, b) => a.localeCompare(b, 'ar')),
      },
    })
  }),

  http.get(apiUrl('/api/platform/pharmacies/:id'), ({ params }) => {
    if (!owner()) return forbidden()
    const item = find(params.id)
    return item ? HttpResponse.json({ data: detail(item) }) : notFound()
  }),

  http.post(apiUrl('/api/platform/pharmacies/:id/extend-trial'), async ({ params, request }) => {
    const item = find(params.id)
    if (!item) return notFound()
    const { days } = (await request.json()) as { days: number }
    if (item.plan !== 'trial') return invalid('plan', 'notTrial')
    if (days !== 7 && days !== 14) return invalid('days', 'invalid')
    const from = item.endsAt > today() ? item.endsAt : today()
    item.endsAt = new Date(Date.parse(`${from}T00:00:00Z`) + days * 86_400_000)
      .toISOString()
      .slice(0, 10)
    item.status = 'active'
    item.history.push({
      kind: 'trialExtended',
      at: new Date().toISOString(),
      params: { days, by: by() },
    })
    return HttpResponse.json({ data: detail(item) })
  }),

  http.post(apiUrl('/api/platform/pharmacies/:id/plan'), async ({ params, request }) => {
    const item = find(params.id)
    if (!item) return notFound()
    const { plan, months } = (await request.json()) as { plan: PaidPlan; months: number }
    if (!['basic', 'pro', 'yearly'].includes(plan)) return invalid('plan', 'invalid')
    if (!(months >= 1 && months <= 24)) return invalid('months', 'invalid')
    const from = item.endsAt > today() && item.plan !== 'trial' ? item.endsAt : today()
    item.plan = plan
    item.endsAt = addMonths(from, months)
    item.status = 'active'
    item.history.push({
      kind: 'planChanged',
      at: new Date().toISOString(),
      params: { plan, until: item.endsAt, by: by() },
    })
    return HttpResponse.json({ data: detail(item) })
  }),

  http.post(apiUrl('/api/platform/pharmacies/:id/suspend'), async ({ params, request }) => {
    const item = find(params.id)
    if (!item) return notFound()
    const { reason } = (await request.json()) as { reason: string }
    if (!reason?.trim()) return invalid('reason', 'required')
    item.status = 'suspended'
    item.history.push({
      kind: 'suspended',
      at: new Date().toISOString(),
      params: { reason: reason.trim(), by: by() },
    })
    return HttpResponse.json({ data: detail(item) })
  }),

  http.post(apiUrl('/api/platform/pharmacies/:id/resume'), ({ params }) => {
    const item = find(params.id)
    if (!item) return notFound()
    item.status = 'active'
    item.history.push({ kind: 'resumed', at: new Date().toISOString(), params: { by: by() } })
    return HttpResponse.json({ data: detail(item) })
  }),

  http.post(apiUrl('/api/platform/pharmacies/:id/support-access'), ({ params }) => {
    const item = find(params.id)
    if (!item) return notFound()
    item.supportAccess = 'requested'
    item.history.push({
      kind: 'supportRequested',
      at: new Date().toISOString(),
      params: { by: by() },
    })
    return HttpResponse.json({ data: detail(item) })
  }),

  http.get(apiUrl('/api/platform/billing'), () => {
    if (!owner()) return forbidden()
    const active = db.platformPharmacies.filter((item) => item.status === 'active')
    const plans: Billing['plans'] = (['basic', 'pro', 'yearly'] as const).map((key) => ({
      key,
      price: db.planPrices[key],
      per: key === 'yearly' ? 'year' : 'month',
      pharmacies: active.filter((item) => item.plan === key).length,
    }))
    const payments = [...db.subscriptionPayments].sort((a, b) => b.date.localeCompare(a.date))
    return HttpResponse.json({
      data: {
        plans,
        payments,
        pending: payments.filter((item) => item.status === 'pending').length,
      },
    })
  }),

  http.put(apiUrl('/api/platform/plans/:plan'), async ({ params, request }) => {
    const plan = String(params.plan) as PaidPlan
    if (!(plan in db.planPrices)) return notFound()
    const { price } = (await request.json()) as { price: number }
    if (!(price > 0)) return invalid('price', 'positive')
    db.planPrices[plan] = price
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiUrl('/api/platform/payments/:id/confirm'), ({ params }) => {
    const payment = db.subscriptionPayments.find((item) => item.id === Number(params.id))
    if (!payment) return notFound()
    if (payment.status !== 'pending')
      return HttpResponse.json({ message: 'Already reviewed.' }, { status: 409 })
    const item = find(payment.pharmacy.id)
    if (!item) return notFound()
    // The plan runs on from when the old one ends, or from today if that has passed.
    const from = item.endsAt > today() && item.plan !== 'trial' ? item.endsAt : today()
    item.plan = payment.plan
    item.endsAt = addMonths(from, payment.plan === 'yearly' ? 12 : 1)
    item.status = 'active'
    item.history.push({
      kind: 'paymentConfirmed',
      at: new Date().toISOString(),
      params: { plan: payment.plan, until: item.endsAt },
    })
    payment.status = 'confirmed'
    if (payment.amount === null) payment.amount = db.planPrices[payment.plan]
    return HttpResponse.json({ data: payment })
  }),

  http.post(apiUrl('/api/platform/payments/:id/reject'), async ({ params, request }) => {
    const payment = db.subscriptionPayments.find((item) => item.id === Number(params.id))
    if (!payment) return notFound()
    if (payment.status !== 'pending')
      return HttpResponse.json({ message: 'Already reviewed.' }, { status: 409 })
    const { reason } = (await request.json()) as { reason: string }
    if (!reason?.trim()) return invalid('reason', 'required')
    payment.status = 'rejected'
    payment.rejectionReason = reason.trim()
    find(payment.pharmacy.id)?.history.push({
      kind: 'paymentRejected',
      at: new Date().toISOString(),
      params: { reason: reason.trim() },
    })
    return HttpResponse.json({ data: payment })
  }),
]
