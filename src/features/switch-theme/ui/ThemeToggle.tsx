import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { resolveTheme, useThemeStore } from '@/shared/lib/theme'

const query = '(prefers-color-scheme: dark)'
function subscribe(onChange: () => void) {
  const list = window.matchMedia?.(query)
  list?.addEventListener('change', onChange)
  return () => list?.removeEventListener('change', onChange)
}
const systemDark = () => window.matchMedia?.(query).matches ?? false

/**
 * One icon button for the top bar: flips between light and dark. The three-way
 * choice (with "device") stays in settings.
 */
export function ThemeToggle() {
  const { t } = useTranslation()
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)
  const prefersDark = useSyncExternalStore(subscribe, systemDark, () => false)
  const isDark = resolveTheme(preference, prefersDark) === 'dark'
  const label = isDark ? t('theme.toLight') : t('theme.toDark')

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-200 hover:text-ink"
    >
      {isDark ? (
        <Sun aria-hidden className="size-5" strokeWidth={2} />
      ) : (
        <Moon aria-hidden className="size-5" strokeWidth={2} />
      )}
    </button>
  )
}
