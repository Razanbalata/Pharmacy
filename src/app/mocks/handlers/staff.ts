import { http, HttpResponse } from 'msw'
import type { PharmacySettingsInput } from '@/entities/pharmacy'
import type { StaffInput, StaffMember } from '@/entities/staff-member'
import { normalizeArabic } from '@/shared/lib/arabic-search'
import { normalizePhone } from '@/shared/lib/validation'
import { logActivity as log } from '../activity-log'
import { apiUrl } from '../api-url'
import { db } from '../db'

let passwordCounter = 0
function temporaryPassword(): string {
  passwordCounter += 1
  return `K7-M4P-${String(91 + passwordCounter).padStart(2, '0')}`
}

function phoneTaken(phone: string, exceptId?: number): boolean {
  return db.staff.some((member) => member.phone === normalizePhone(phone) && member.id !== exceptId)
}

function taken() {
  return HttpResponse.json(
    { message: 'The phone has already been taken.', errors: { phone: ['taken'] } },
    { status: 422 },
  )
}

const DAY_MS = 86_400_000
function inPeriod(iso: string, period: string): boolean {
  const today = Date.parse(`${db.today}T00:00:00Z`)
  const at = Date.parse(iso)
  if (period === 'today') return at >= today
  if (period === 'week') return at >= today - 6 * DAY_MS
  return at >= today - 29 * DAY_MS
}

export const staffHandlers = [
  http.get(apiUrl('/api/staff'), () => HttpResponse.json({ data: db.staff })),

  http.post(apiUrl('/api/staff'), async ({ request }) => {
    const input = (await request.json()) as StaffInput
    if (phoneTaken(input.phone)) return taken()
    const member: StaffMember = {
      ...input,
      phone: normalizePhone(input.phone),
      id: Math.max(...db.staff.map((item) => item.id)) + 1,
      active: true,
      isOwner: false,
      lastLoginAt: null,
    }
    db.staff.push(member)
    log({ kind: 'settings', event: 'staffAdded', params: { name: member.name }, detail: null })
    return HttpResponse.json(
      { data: { ...member, temporaryPassword: temporaryPassword() } },
      { status: 201 },
    )
  }),

  http.put(apiUrl('/api/staff/:id'), async ({ params, request }) => {
    const member = db.staff.find((item) => item.id === Number(params['id']))
    if (!member) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    if (member.isOwner)
      return HttpResponse.json({ message: 'The owner cannot be edited here.' }, { status: 403 })
    const input = (await request.json()) as StaffInput
    if (phoneTaken(input.phone, member.id)) return taken()
    Object.assign(member, input, { phone: normalizePhone(input.phone) })
    return HttpResponse.json({ data: member })
  }),

  http.patch(apiUrl('/api/staff/:id/status'), async ({ params, request }) => {
    const member = db.staff.find((item) => item.id === Number(params['id']))
    if (!member) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    if (member.isOwner)
      return HttpResponse.json({ message: 'The owner cannot be stopped.' }, { status: 403 })
    const body = (await request.json()) as { active: boolean }
    member.active = body.active
    if (!body.active)
      log({ kind: 'sensitive', event: 'staffStopped', params: { name: member.name }, detail: null })
    return HttpResponse.json({ data: member })
  }),

  http.post(apiUrl('/api/staff/:id/reset-password'), ({ params }) => {
    const member = db.staff.find((item) => item.id === Number(params['id']))
    if (!member || member.isOwner)
      return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    return HttpResponse.json({ data: { temporaryPassword: temporaryPassword() } })
  }),

  http.get(apiUrl('/api/activity'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const period = query.get('period') ?? 'today'
    const actor = query.get('actor')
    const kind = query.get('kind')
    const sensitive = query.get('sensitive')
    const search = normalizeArabic(query.get('search') ?? '')
    const list = db.activity.filter(
      (entry) =>
        inPeriod(entry.at, period) &&
        (!actor || entry.actor.id === Number(actor)) &&
        (!kind || entry.kind === kind) &&
        (!sensitive || entry.kind === 'sensitive') &&
        (!search ||
          normalizeArabic(
            `${Object.values(entry.params).join(' ')} ${entry.detail ?? ''}`,
          ).includes(search)),
    )
    return HttpResponse.json({ data: list })
  }),

  http.get(apiUrl('/api/settings'), () => HttpResponse.json({ data: db.settings })),

  http.put(apiUrl('/api/settings'), async ({ request }) => {
    const input = (await request.json()) as PharmacySettingsInput
    const before = db.settings.stock.expiryAlertDays
    db.settings = { ...db.settings, ...input }
    if (before !== input.stock.expiryAlertDays) {
      log({
        kind: 'settings',
        event: 'settingsChanged',
        params: { field: 'مدة تنبيه الصلاحية', from: before, to: input.stock.expiryAlertDays },
        detail: null,
      })
    }
    return HttpResponse.json({ data: db.settings })
  }),
]
