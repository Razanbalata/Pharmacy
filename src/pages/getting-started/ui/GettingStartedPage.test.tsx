import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('GettingStartedPage', () => {
  it('lists the six steps with the next one highlighted', async () => {
    await renderApp('/getting-started')
    await screen.findByText('2 من 6')
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(6)
    expect(within(list).getByRole('link', { name: 'ابدئي الاستيراد' })).toHaveAttribute(
      'href',
      '/products?import=1',
    )
  })

  it('hides the list and opens the dashboard', async () => {
    const { router } = await renderApp('/getting-started')
    await userEvent.click(await screen.findByRole('button', { name: 'خفي القائمة' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'لوحة التحكم' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
