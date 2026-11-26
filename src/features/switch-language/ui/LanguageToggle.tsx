import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useLanguageStore } from '@/shared/i18n'

/** Icon button for the top bar: switches to the other language in one press. */
export function LanguageToggle() {
  const { t } = useTranslation()
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  const other = language === 'ar' ? 'en' : 'ar'

  return (
    <button
      type="button"
      onClick={() => setLanguage(other)}
      aria-label={t('language.switchTo')}
      title={t('language.switchTo')}
      lang={other}
      className="flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-small font-semibold text-ink-muted transition-colors hover:bg-surface-200 hover:text-ink"
    >
      <Languages aria-hidden className="size-5" strokeWidth={2} />
      <span aria-hidden>{other === 'en' ? 'EN' : 'ع'}</span>
    </button>
  )
}
