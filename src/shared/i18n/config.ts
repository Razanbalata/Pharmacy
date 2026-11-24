import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { ar, type Messages } from './locales/ar'
import { en } from './locales/en'

export const LANGUAGES = ['ar', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'ar'

export const resources = {
  ar: { translation: ar },
  en: { translation: en },
} as const

/** Writing direction for each language. */
export function directionOf(language: Language): 'rtl' | 'ltr' {
  return language === 'ar' ? 'rtl' : 'ltr'
}

/** Own instance instead of the global default, so tests and the app share one clear setup. */
const i18n = createInstance()

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
})

export { i18n }

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends readonly unknown[]
      ? never
      : Leaves<T[K], `${Prefix}${K}.`>
}[keyof T & string]

/** Any translation key, e.g. 'validation.required'. Used for messages chosen at runtime. */
export type TranslationKey = Leaves<Messages>
