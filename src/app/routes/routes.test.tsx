import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
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
  it('shows a new manager the getting-started list instead of the dashboard', async () => {
    const router = renderAt('/')
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'أهلاً رزان، صيدلية الشفاء جاهزة تقريباً',
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/getting-started')
  })

  it('shows other roles the dashboard at /', async () => {
    localStorage.setItem('mockRole', 'pharmacist')
    renderAt('/')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'لوحة التحكم' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'القائمة الرئيسية' }).length).toBeGreaterThan(
      0,
    )
  })

  it('moves between screens from the sidebar', async () => {
    const router = renderAt('/products')
    await screen.findByRole('heading', { level: 1, name: 'الأصناف' })
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
    localStorage.setItem('mockRole', 'none')
    const router = renderAt('/products')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'أهلاً فيكِ من جديد' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('sends the platform owner to the join requests', async () => {
    localStorage.setItem('mockRole', 'platform')
    const router = renderAt('/products')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'طلبات الانضمام' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/platform/requests')
  })

  it('sends a pharmacy user away from the platform screens', async () => {
    localStorage.setItem('mockRole', 'pharmacist')
    const router = renderAt('/platform/requests')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'لوحة التحكم' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
