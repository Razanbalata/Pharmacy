import { useEffect } from 'react'
import { usePaletteStore } from './store'

/** Ctrl+K (Cmd+K on Mac) opens the palette from anywhere. */
export function usePaletteHotkey(): void {
  const setOpen = usePaletteStore((state) => state.setOpen)
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])
}
