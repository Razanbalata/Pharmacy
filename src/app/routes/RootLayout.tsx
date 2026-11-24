import { Outlet } from 'react-router'
import { Toaster } from '@/shared/ui/toast'
import { OfflineBanner } from '@/widgets/network-status'

/** Wraps every page, signed in or not: offline banner and quick messages. */
export function RootLayout() {
  return (
    <>
      <OfflineBanner />
      <Outlet />
      <Toaster />
    </>
  )
}
