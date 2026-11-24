import { env } from '@/shared/config'

/** Full URL of an API path, matching what shared/api sends. */
export function apiUrl(path: string): string {
  return new URL(path, env.VITE_API_URL).toString()
}
