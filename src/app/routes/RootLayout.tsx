import { Outlet } from 'react-router'
import { Toaster } from '@/shared/ui/toast'
import { OfflineBanner } from '@/widgets/network-status'

/** Wraps every page. The app shell (sidebar, top bar) comes here next. */
export function RootLayout() {
  return (
    <>
      <OfflineBanner />
      <Outlet />
      <Toaster />
    </>
  )
}
