import { http, HttpResponse } from 'msw'
import type { LoginInput } from '@/entities/session'
import { normalizePhone } from '@/shared/lib/validation'
import { apiUrl } from '../api-url'
import { db } from '../db'
import { MOCK_PASSWORD, mockRole, setMockRole, users, type MockRole } from '../fixtures'

const MAX_ATTEMPTS = 5

function findRole(login: string): MockRole | undefined {
  const phone = normalizePhone(login)
  return (Object.keys(users) as MockRole[]).find((role) => users[role].phone === phone)
}

function signedIn(role: MockRole) {
  const user = users[role]
  if (user.role === 'platform_owner') return user
  return { ...user, pharmacy: { ...user.pharmacy, onboardingDone: db.onboarding.dismissed } }
}

export const sessionHandlers = [
  http.get(apiUrl('/sanctum/csrf-cookie'), () => new HttpResponse(null, { status: 204 })),

  http.get(apiUrl('/api/me'), () => {
    const role = mockRole()
    if (!role) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    return HttpResponse.json({ data: signedIn(role) })
  }),

  http.post(apiUrl('/api/login'), async ({ request }) => {
    if (db.failedLogins >= MAX_ATTEMPTS) {
      return HttpResponse.json(
        { message: 'Too many attempts.', retryAfterMinutes: 15 },
        { status: 429 },
      )
    }
    const body = (await request.json()) as LoginInput
    const role = findRole(body.login)
    if (!role || body.password !== MOCK_PASSWORD) {
      db.failedLogins += 1
      return HttpResponse.json(
        {
          message: 'These credentials do not match our records.',
          errors: { login: ['credentials'] },
          attemptsLeft: MAX_ATTEMPTS - db.failedLogins,
        },
        { status: 422 },
      )
    }
    db.failedLogins = 0
    setMockRole(role)
    return HttpResponse.json({ data: signedIn(role) })
  }),

  http.post(apiUrl('/api/logout'), () => {
    setMockRole(null)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(apiUrl('/api/password/otp'), async ({ request }) => {
    const body = (await request.json()) as { login: string }
    const role = findRole(body.login)
    // Same answer whether the number exists or not, so nobody can check who has an account.
    const phone = role ? users[role].phone : normalizePhone(body.login)
    return HttpResponse.json(
      { data: { last: phone.slice(-3), resendInSeconds: 45 } },
      { status: 202 },
    )
  }),

  http.post(apiUrl('/api/password/verify'), async ({ request }) => {
    const body = (await request.json()) as { code: string }
    if (body.code !== db.resetCode) {
      return HttpResponse.json(
        { message: 'Invalid code.', errors: { code: ['invalid'] } },
        { status: 422 },
      )
    }
    const resetToken = `reset-${db.resetTokens.size + 1}`
    db.resetTokens.add(resetToken)
    return HttpResponse.json({ data: { resetToken } })
  }),

  http.post(apiUrl('/api/password/reset'), async ({ request }) => {
    const body = (await request.json()) as { resetToken: string }
    if (!db.resetTokens.has(body.resetToken)) {
      return HttpResponse.json({ message: 'Invalid token.' }, { status: 422 })
    }
    db.resetTokens.delete(body.resetToken)
    return new HttpResponse(null, { status: 204 })
  }),
]
