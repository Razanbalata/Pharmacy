import { Navigate } from 'react-router'
import { useCurrentUser } from '@/entities/session'
import { ComingSoonPage } from '@/pages/coming-soon'
import { paths } from '@/shared/config'

/**
 * "/" for a pharmacy: the manager sees the getting-started list until she finishes or hides it.
 * The real dashboard replaces ComingSoonPage in module 9.
 */
export function DashboardEntry() {
  const { data: user } = useCurrentUser()
  if (user && 'pharmacy' in user && user.role === 'manager' && !user.pharmacy.onboardingDone) {
    return <Navigate to={paths.gettingStarted} replace />
  }
  return <ComingSoonPage navKey="dashboard" module={9} />
}
