import { http, HttpResponse } from 'msw'
import type { PharmacyProfileInput, StartMethod } from '@/entities/pharmacy'
import { apiUrl } from '../api-url'
import { db } from '../db'

export const pharmacyHandlers = [
  http.get(apiUrl('/api/pharmacy'), () => HttpResponse.json({ data: db.profile })),

  http.put(apiUrl('/api/pharmacy'), async ({ request }) => {
    const input = (await request.json()) as PharmacyProfileInput
    db.profile = { ...db.profile, ...input }
    return HttpResponse.json({ data: db.profile })
  }),

  http.get(apiUrl('/api/cities'), () => HttpResponse.json({ data: db.cities })),

  http.post(apiUrl('/api/onboarding/start'), async ({ request }) => {
    const body = (await request.json()) as { method: StartMethod }
    // Sample data counts as products imported, so the checklist moves on.
    if (body.method === 'sample') {
      const step = db.onboarding.steps.find((item) => item.key === 'products')
      if (step) step.done = true
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('/api/onboarding'), () => HttpResponse.json({ data: db.onboarding })),

  http.post(apiUrl('/api/onboarding/dismiss'), () => {
    db.onboarding.dismissed = true
    return new HttpResponse(null, { status: 204 })
  }),
]
