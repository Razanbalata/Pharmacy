import { paths } from '@/shared/config'
import type { SessionUser } from './types'

/** Where each user lands after signing in, as the design says. */
export function landingPathFor(user: SessionUser): string {
  if (user.role === 'platform_owner') return paths.platformRequests
  if (user.role === 'cashier') return paths.pos
  return paths.dashboard
}
