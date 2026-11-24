import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors'
import { http } from './http'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('http', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    document.cookie = 'XSRF-TOKEN=abc%3D123'
  })

  function firstCall(): [string, RequestInit] {
    const call = fetchMock.mock.calls[0]
    if (!call) throw new Error('fetch was not called')
    return [String(call[0]), call[1] ?? {}]
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('sends cookies and the XSRF token on changing requests', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await http.post('/api/invoices', { total: 184 })

    const [, init] = firstCall()
    expect(init.credentials).toBe('include')
    expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('abc=123')
    expect(init.body).toBe(JSON.stringify({ total: 184 }))
  })

  it('does not send the XSRF token on reads', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []))
    await http.get('/api/products', { query: { search: 'panadol', page: 2, skip: undefined } })

    const [url, init] = firstCall()
    expect(url).toBe('http://localhost:8000/api/products?search=panadol&page=2')
    expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBeUndefined()
  })

  it('turns a Laravel validation error into field errors', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, { message: 'Invalid', errors: { phone: ['الرقم مسجل من قبل'] } }),
    )
    const error = await http.post('/api/join-requests', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).isValidation).toBe(true)
    expect((error as ApiError).fieldErrors['phone']).toEqual(['الرقم مسجل من قبل'])
  })

  it('marks an ended session as unauthenticated', async () => {
    fetchMock.mockResolvedValue(jsonResponse(419, { message: 'CSRF token mismatch.' }))
    const error = (await http.post('/api/logout').catch((e: unknown) => e)) as ApiError
    expect(error.isUnauthenticated).toBe(true)
  })

  it('accepts success answers without a body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }))
    await expect(http.post('/api/activation/abc/resend')).resolves.toBeUndefined()
  })

  it('reports a network failure with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = (await http.get('/api/me').catch((e: unknown) => e)) as ApiError
    expect(error.isNetwork).toBe(true)
  })
})
