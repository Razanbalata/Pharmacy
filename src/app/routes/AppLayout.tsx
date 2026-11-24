import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useNavigation } from 'react-router'
import { isPlatformOwner, useCurrentUser } from '@/entities/session'
import { ApiError } from '@/shared/api'
import { paths } from '@/shared/config'
import { Drawer } from '@/shared/ui/dialog'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { CommandPalette, usePaletteHotkey, usePaletteStore } from '@/widgets/command-palette'
import { Sidebar } from '@/widgets/sidebar'
import { Topbar } from '@/widgets/topbar'
import { AppSkeleton } from './AppSkeleton'
import { skeletonFor } from './skeletons'

/**
 * The frame around every signed-in page: sidebar, top bar, search palette.
 * While the next page's code downloads, its skeleton shows in place of the old page.
 */
export function AppLayout() {
  const { t } = useTranslation()
  const { data: user, error, isPending } = useCurrentUser()
  const navigation = useNavigation()
  const openPalette = usePaletteStore((state) => state.setOpen)
  const [menuOpen, setMenuOpen] = useState(false)
  usePaletteHotkey()

  if (error instanceof ApiError && error.isUnauthenticated)
    return <Navigate to={paths.login} replace />
  if (isPending || !user) return <AppSkeleton />
  if (isPlatformOwner(user)) return <Navigate to={paths.platformRequests} replace />

  const nextPath = navigation.state === 'loading' ? navigation.location.pathname : null

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">
        <Sidebar user={user} />
      </aside>

      <Drawer
        side="start"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('nav.main')}
        bodyClassName="p-0"
      >
        <Sidebar user={user} onNavigate={() => setMenuOpen(false)} />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenSearch={() => openPalette(true)}
        />
        <main className="mx-auto w-full max-w-[1240px] flex-1 p-4 sm:p-7">
          {nextPath ? <PageSkeleton variant={skeletonFor(nextPath)} /> : <Outlet />}
        </main>
      </div>

      <CommandPalette role={user.role} />
    </div>
  )
}
