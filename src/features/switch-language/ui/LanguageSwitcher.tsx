import { useTranslation } from 'react-i18next'
import { LANGUAGES, useLanguageStore } from '@/shared/i18n'
import { cn } from '@/shared/lib/cn'

/** Arabic / English switch. Changing it also flips the page direction. */
export function LanguageSwitcher() {
  const { t } = useTranslation()
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)

  return (
    <fieldset className="inline-flex overflow-hidden rounded-md border border-border-strong">
      <legend className="sr-only">{t('language.label')}</legend>
      {LANGUAGES.map((option) => (
        <label
          key={option}
          lang={option}
          className={cn(
            'cursor-pointer px-3 py-1.5 text-small has-focus-visible:outline-3 has-focus-visible:outline-focus',
            language === option ? 'bg-ink text-surface-100' : 'text-ink hover:bg-surface-200',
          )}
        >
          <input
            type="radio"
            name="language"
            value={option}
            checked={language === option}
            onChange={() => setLanguage(option)}
            className="sr-only"
          />
          {t(`language.${option}`)}
        </label>
      ))}
    </fieldset>
  )
}
