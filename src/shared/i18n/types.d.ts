import type { Messages } from './locales/ar'

// Makes t('...') keys type-checked against the Arabic messages.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: Messages }
  }
}
