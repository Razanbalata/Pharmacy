import { http, HttpResponse } from 'msw'
import { apiUrl } from '../api-url'

export const alertHandlers = [
  http.get(apiUrl('/api/alerts/summary'), () => HttpResponse.json({ data: { unread: 8 } })),
]
