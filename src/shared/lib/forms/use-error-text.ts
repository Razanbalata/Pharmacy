import { useTranslation } from 'react-i18next'
import type { TranslationKey } from '@/shared/i18n'

/** Validation messages are stored as translation keys; this turns one into text. */
export function useErrorText(): (message: string | undefined) => string | undefined {
  const { t } = useTranslation()
  return (message) => (message ? t(message as TranslationKey) : undefined)
}
