import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('LandingPage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'none'))

  it('greets a visitor at the home address instead of the login form', async () => {
    const { router } = await renderApp('/')
    expect(
      await screen.findByRole('heading', { level: 1, name: /صيدليتك كلها بشاشة وحدة/ }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/welcome')
  })

  it('leads to the join request and to sign in', async () => {
    const { router } = await renderApp('/welcome')
    await userEvent.click(
      (await screen.findAllByRole('link', { name: 'اطلبي انضمام صيدليتك' }))[0]!,
    )
    // The next page loads lazily, so the address changes once its code is in.
    await waitFor(() => expect(router.state.location.pathname).toBe('/join'))
    await router.navigate('/welcome')
    await userEvent.click(await screen.findByRole('link', { name: 'عندي حساب' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('still sends a deep link to sign in', async () => {
    const { router } = await renderApp('/customers')
    await screen.findByRole('button', { name: /دخول/ })
    expect(router.state.location.pathname).toBe('/login')
  })
})
