import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { THEME_PREFERENCES, useThemeStore } from '@/shared/lib/theme'

/** Three-way switch: device, light, dark. Real radio inputs, so keyboard and screen readers work. */
export function ThemeSwitcher() {
  const { t } = useTranslation()
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)

  return (
    <fieldset className="inline-flex overflow-hidden rounded-md border border-border-strong">
      <legend className="sr-only">{t('theme.label')}</legend>
      {THEME_PREFERENCES.map((option) => (
        <label
          key={option}
          className={cn(
            'cursor-pointer px-3 py-1.5 text-small has-focus-visible:outline-3 has-focus-visible:outline-focus',
            preference === option ? 'bg-ink text-surface-100' : 'text-ink hover:bg-surface-200',
          )}
        >
          <input
            type="radio"
            name="theme"
            value={option}
            checked={preference === option}
            onChange={() => setPreference(option)}
            className="sr-only"
          />
          {t(`theme.${option}`)}
        </label>
      ))}
    </fieldset>
  )
}
