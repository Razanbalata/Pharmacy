import { env } from '@/shared/config'
import { ApiError, type FieldErrors } from './errors'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

const XSRF_COOKIE = 'XSRF-TOKEN'

function readCookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

function buildUrl(path: string, query: RequestOptions['query']): string {
  const url = new URL(path, env.VITE_API_URL)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function readError(response: Response): Promise<ApiError> {
  let message = response.statusText
  let fieldErrors: FieldErrors = {}
  try {
    const data = (await response.json()) as { message?: string; errors?: FieldErrors }
    message = data.message ?? message
    fieldErrors = data.errors ?? {}
  } catch {
    // The body was not JSON; keep the status text.
  }
  return new ApiError(response.status, message, fieldErrors)
}

/**
 * Laravel Sanctum (SPA cookie mode): the session lives in an http-only cookie,
 * and every changing request sends the XSRF token back in a header.
 */
export async function request<T>(
  method: Method,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const xsrf = readCookie(XSRF_COOKIE)
  if (xsrf && method !== 'GET') headers['X-XSRF-TOKEN'] = xsrf

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      credentials: 'include',
      body: options.body === undefined ? null : JSON.stringify(options.body),
      signal: options.signal ?? null,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Network error')
  }

  if (!response.ok) throw await readError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Must be called once before login, so Laravel sets the XSRF cookie. */
export function fetchCsrfCookie(): Promise<void> {
  return request<void>('GET', '/sanctum/csrf-cookie')
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}
