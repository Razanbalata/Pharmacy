import { useEffect, type ReactNode } from 'react'
import { applyTheme, resolveTheme, useThemeStore } from '@/shared/lib/theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Keeps <html data-theme> in step with the saved choice and, for "system", with the device. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useThemeStore((state) => state.preference)

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const update = () => applyTheme(resolveTheme(preference, media.matches))
    update()
    if (preference !== 'system') return undefined
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [preference])

  return children
}
