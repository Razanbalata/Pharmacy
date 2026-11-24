import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { i18n } from '@/shared/i18n'

// Tests read Arabic labels, the app's default language.
beforeEach(async () => {
  await i18n.changeLanguage('ar')
})

afterEach(() => cleanup())
