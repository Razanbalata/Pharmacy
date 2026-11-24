import { http, HttpResponse } from 'msw'
import { apiUrl } from '../api-url'
import { mockRole, users } from '../fixtures'

export const sessionHandlers = [
  http.get(apiUrl('/sanctum/csrf-cookie'), () => new HttpResponse(null, { status: 204 })),
  http.get(apiUrl('/api/me'), () => HttpResponse.json({ data: users[mockRole()] })),
]
