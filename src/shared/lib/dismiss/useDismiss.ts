import { useEffect, type RefObject } from 'react'

/**
 * Closes a popover (a menu, a small panel) when the user presses outside it or
 * presses Escape. Listens only while it is open.
 */
export function useDismiss(
  box: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) onDismiss()
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [box, open, onDismiss])
}
