import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { server } from '@test/setup'
import { routes } from './routes'

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('routes', () => {
  it('opens the app frame with the dashboard at /', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'لوحة التحكم' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'القائمة الرئيسية' })).toBeInTheDocument()
  })

  it('moves between screens from the sidebar', async () => {
    const router = renderAt('/')
    await screen.findByRole('heading', { level: 1, name: 'لوحة التحكم' })
    const nav = screen.getAllByRole('navigation', { name: 'القائمة الرئيسية' })[0]
    if (!nav) throw new Error('no sidebar')
    await userEvent.click(nav.querySelector('a[href="/suppliers"]') as HTMLElement)
    expect(await screen.findByRole('heading', { level: 1, name: 'الموردون' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/suppliers')
  })

  it('shows not found for an unknown address', async () => {
    renderAt('/no-such-page')
    expect(await screen.findByRole('heading', { name: 'الصفحة مش موجودة' })).toBeInTheDocument()
  })

  it('sends a signed-out user to the login screen', async () => {
    server.use(
      http.get('*/api/me', () =>
        HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 }),
      ),
    )
    const router = renderAt('/products')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'تسجيل الدخول' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})
