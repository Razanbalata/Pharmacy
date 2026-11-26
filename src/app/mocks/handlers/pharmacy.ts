import { http, HttpResponse } from 'msw'
import type { PharmacyProfileInput, StartMethod } from '@/entities/pharmacy'
import { apiUrl } from '../api-url'
import { db } from '../db'

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const LOGO_MAX_BYTES = 1024 * 1024

export const pharmacyHandlers = [
  http.get(apiUrl('/api/pharmacy'), () => HttpResponse.json({ data: db.profile })),

  http.put(apiUrl('/api/pharmacy'), async ({ request }) => {
    const input = (await request.json()) as PharmacyProfileInput
    db.profile = { ...db.profile, ...input }
    return HttpResponse.json({ data: db.profile })
  }),

  http.post(apiUrl('/api/pharmacy/logo'), async ({ request }) => {
    const entry = (await request.formData()).get('logo')
    // Not instanceof File: in tests the File class of the page and of fetch can differ.
    const file = entry !== null && typeof entry === 'object' ? entry : null
    const problem = !file
      ? 'required'
      : !LOGO_TYPES.includes(file.type)
        ? 'logoType'
        : file.size > LOGO_MAX_BYTES
          ? 'logoSize'
          : null
    if (problem || !file)
      return HttpResponse.json(
        { message: 'The given data was invalid.', errors: { logo: [problem ?? 'required'] } },
        { status: 422 },
      )
    const bytes = new Uint8Array(await file.arrayBuffer())
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    db.profile = { ...db.profile, logoUrl: `data:${file.type};base64,${btoa(binary)}` }
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
