import { useState, type ReactNode } from 'react'
import { AnalysisDrawer } from './AnalysisDrawer'

/**
 * Opens the smart analysis in place, as a side panel over the current page, so the
 * user stays where they were. Looks like whatever className it is given.
 */
export function SmartAnalysisButton({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      <AnalysisDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
