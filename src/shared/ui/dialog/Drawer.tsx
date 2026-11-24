import { cn } from '@/shared/lib/cn'
import { ModalBase, type ModalBaseProps } from './ModalBase'

interface DrawerProps extends ModalBaseProps {
  /**
   * "end" (default) for quick add and edit: the left in Arabic, the right in English.
   * "start" for the menu on small screens, on the same side as the sidebar.
   */
  side?: 'start' | 'end'
  bodyClassName?: string
}

/** Side panel for quick add and edit (new customer, new staff member, return...). */
export function Drawer({ side = 'end', bodyClassName, ...props }: DrawerProps) {
  return (
    <ModalBase
      {...props}
      {...(bodyClassName ? { bodyClassName } : {})}
      className={cn(
        'm-0 h-dvh max-h-none w-[min(460px,100vw)] rounded-none',
        side === 'end' ? 'ms-auto' : 'me-auto',
      )}
    />
  )
}
