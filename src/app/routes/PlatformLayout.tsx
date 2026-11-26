import { Navigate, Outlet, useNavigation } from 'react-router'
import { isPlatformOwner, landingPathFor, useCurrentUser } from '@/entities/session'
import { LogoutButton } from '@/features/auth/logout'
import { ApiError } from '@/shared/api'
import { paths } from '@/shared/config'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { PlatformNav } from '@/widgets/platform-nav'

/** The platform owner's frame. Pharmacy users are sent back to their own screens. */
export function PlatformLayout() {
  const { data: user, error, isPending } = useCurrentUser()
  const navigation = useNavigation()

  if (error instanceof ApiError && error.isUnauthenticated)
    return <Navigate to={paths.login} replace />
  if (isPending || !user) return <PageSkeleton variant="list" />
  if (!isPlatformOwner(user)) return <Navigate to={landingPathFor(user)} replace />

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 md:block">
        <PlatformNav footer={<LogoutButton />} />
      </aside>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {navigation.state === 'loading' ? <PageSkeleton variant="list" /> : <Outlet />}
      </main>
    </div>
  )
}
