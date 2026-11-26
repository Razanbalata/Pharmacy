import { useTranslation } from 'react-i18next'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { THEME_PREFERENCES, useThemeStore } from '@/shared/lib/theme'

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const

/** Three-way switch: device, light, dark. Real radio inputs, so keyboard and screen readers work. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)

  return (
    <fieldset
      className={cn(
        'inline-flex gap-1 rounded-lg border border-border bg-surface-200/70 p-1',
        className,
      )}
    >
      <legend className="sr-only">{t('theme.label')}</legend>
      {THEME_PREFERENCES.map((option) => {
        const Icon = ICONS[option]
        const active = preference === option
        return (
          <label
            key={option}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 text-small font-medium whitespace-nowrap transition-colors has-focus-visible:outline-3 has-focus-visible:outline-focus',
              active
                ? 'bg-surface-100 font-semibold text-ink shadow-card'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option}
              checked={active}
              onChange={() => setPreference(option)}
              className="sr-only"
            />
            <Icon aria-hidden className="size-4" strokeWidth={2} />
            {t(`theme.${option}`)}
          </label>
        )
      })}
    </fieldset>
  )
}
