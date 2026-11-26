import { useTranslation } from 'react-i18next'
import { LANGUAGES, useLanguageStore } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'

/** Arabic / English switch. Changing it also flips the page direction. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)

  return (
    <fieldset
      className={cn(
        'inline-flex gap-1 rounded-lg border border-border bg-surface-200/70 p-1',
        className,
      )}
    >
      <legend className="sr-only">{t('language.label')}</legend>
      {LANGUAGES.map((option) => {
        const active = language === option
        return (
          <label
            key={option}
            lang={option}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center rounded-md px-4 py-1.5 text-small font-medium whitespace-nowrap transition-colors has-focus-visible:outline-3 has-focus-visible:outline-focus',
              active
                ? 'bg-surface-100 font-semibold text-ink shadow-card'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name="language"
              value={option}
              checked={active}
              onChange={() => setLanguage(option)}
              className="sr-only"
            />
            {t(`language.${option}`)}
          </label>
        )
      })}
    </fieldset>
  )
}
