import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { handlers } from '@/app/mocks/handlers'
import { i18n } from '@/shared/i18n'

/** The same fake server the browser uses, so tests and development see the same data. */
export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

// Tests read Arabic labels, the app's default language.
beforeEach(async () => {
  localStorage.clear()
  await i18n.changeLanguage('ar')
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())

// jsdom has <dialog> but not its modal methods yet; this is just enough for tests.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
  }
}
