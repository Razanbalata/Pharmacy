import { Navigate, Outlet } from 'react-router'
import { useCurrentUser } from '@/entities/session'
import { ApiError } from '@/shared/api'
import { paths } from '@/shared/config'
import { PageSkeleton } from '@/shared/ui/skeleton'

/** Signed-in pages that have no sidebar yet, like setting up the pharmacy. */
export function RequireAuth() {
  const { data: user, error, isPending } = useCurrentUser()
  if (error instanceof ApiError && error.isUnauthenticated)
    return <Navigate to={paths.login} replace />
  if (isPending || !user) {
    return (
      <div className="p-8">
        <PageSkeleton variant="form" />
      </div>
    )
  }
  return <Outlet />
}
