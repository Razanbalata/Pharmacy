import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '@/entities/session'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { dashboardQueries } from '../api/dashboard-api'
import { ManagerDashboard } from './ManagerDashboard'
import { StaffDashboard } from './StaffDashboard'

/** "/" for a pharmacy: one dashboard for the manager, a working one for everyone else. */
export function DashboardPage() {
  const { data: user } = useCurrentUser()
  const { data, isPending } = useQuery(dashboardQueries.summary())
  if (isPending || !data || !user || !('pharmacy' in user)) return <PageSkeleton variant="detail" />
  return user.role === 'manager' ? (
    <ManagerDashboard data={data} />
  ) : (
    <StaffDashboard data={data} role={user.role} />
  )
}
