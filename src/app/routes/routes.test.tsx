import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('routes', () => {
  it('opens the home page at /', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'فارما سمارت' }),
    ).toBeInTheDocument()
  })

  it('shows not found for an unknown address', async () => {
    renderAt('/no-such-page')
    expect(await screen.findByRole('heading', { name: 'الصفحة مش موجودة' })).toBeInTheDocument()
  })
})
