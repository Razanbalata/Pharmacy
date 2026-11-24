import { useEffect, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { directionOf, i18n, useLanguageStore } from '@/shared/i18n'

/** Applies the saved language to i18next and sets lang and dir on <html>. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useLanguageStore((state) => state.language)

  useEffect(() => {
    void i18n.changeLanguage(language)
    document.documentElement.lang = language
    document.documentElement.dir = directionOf(language)
  }, [language])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
