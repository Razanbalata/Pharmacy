import { http, HttpResponse } from 'msw'
import type { JoinRequest, JoinRequestInput } from '@/entities/join-request'
import { normalizePhone } from '@/shared/lib/validation'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { setMockRole } from '../fixtures'

function nextReference(): { id: number; reference: string } {
  const id = Math.max(...db.joinRequests.map((request) => request.id)) + 1
  return { id, reference: `REQ-${String(id).padStart(4, '0')}` }
}

function create(input: JoinRequestInput, status: JoinRequest['status']): JoinRequest {
  const { id, reference } = nextReference()
  const request: JoinRequest = {
    ...input,
    phone: normalizePhone(input.phone),
    id,
    reference,
    status,
    hasLicensePhoto: false,
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  }
  db.joinRequests.unshift(request)
  return request
}

function phoneTaken(phone: string): boolean {
  return db.joinRequests.some(
    (request) => request.phone === normalizePhone(phone) && request.status !== 'rejected',
  )
}

export const joinRequestHandlers = [
  // Public join form.
  http.post(apiUrl('/api/join-requests'), async ({ request }) => {
    const input = (await request.json()) as JoinRequestInput
    if (phoneTaken(input.phone)) {
      return HttpResponse.json(
        { message: 'The phone has already been taken.', errors: { phone: ['taken'] } },
        { status: 422 },
      )
    }
    const created = create(input, 'new')
    return HttpResponse.json({ data: { reference: created.reference } }, { status: 201 })
  }),

  // Activation link.
  http.get(apiUrl('/api/activation/:token'), ({ params }) => {
    const entry = db.activationTokens.get(String(params['token']))
    if (!entry) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    if (entry.expired) return HttpResponse.json({ message: 'Expired.' }, { status: 410 })
    const request = db.joinRequests.find((item) => item.id === entry.requestId)
    if (!request) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    return HttpResponse.json({
      data: {
        pharmacyName: request.pharmacyName,
        ownerName: request.ownerName,
        phone: request.phone,
      },
    })
  }),

  http.post(apiUrl('/api/activation/:token/resend'), () => new HttpResponse(null, { status: 202 })),

  http.post(apiUrl('/api/activation/:token'), ({ params }) => {
    const entry = db.activationTokens.get(String(params['token']))
    if (!entry || entry.expired) return HttpResponse.json({ message: 'Expired.' }, { status: 410 })
    const request = db.joinRequests.find((item) => item.id === entry.requestId)
    if (request) request.status = 'activated'
    db.activationTokens.delete(String(params['token']))
    // The fake server signs the new owner in as the design's manager.
    setMockRole('manager')
    return new HttpResponse(null, { status: 204 })
  }),

  // Platform owner.
  http.get(apiUrl('/api/platform/join-requests'), ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const list = status ? db.joinRequests.filter((item) => item.status === status) : db.joinRequests
    return HttpResponse.json({ data: list })
  }),

  http.post(apiUrl('/api/platform/join-requests'), async ({ request }) => {
    const input = (await request.json()) as JoinRequestInput
    if (phoneTaken(input.phone)) {
      return HttpResponse.json(
        { message: 'The phone has already been taken.', errors: { phone: ['taken'] } },
        { status: 422 },
      )
    }
    return HttpResponse.json({ data: create(input, 'approved') }, { status: 201 })
  }),

  http.post(apiUrl('/api/platform/join-requests/:id/approve'), ({ params }) => {
    const request = db.joinRequests.find((item) => item.id === Number(params['id']))
    if (!request) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    request.status = 'approved'
    return HttpResponse.json({ data: request })
  }),

  http.post(apiUrl('/api/platform/join-requests/:id/reject'), async ({ params, request }) => {
    const item = db.joinRequests.find((entry) => entry.id === Number(params['id']))
    if (!item) return HttpResponse.json({ message: 'Not found.' }, { status: 404 })
    const body = (await request.json()) as { reason: string }
    item.status = 'rejected'
    item.rejectionReason = body.reason
    return HttpResponse.json({ data: item })
  }),
]
