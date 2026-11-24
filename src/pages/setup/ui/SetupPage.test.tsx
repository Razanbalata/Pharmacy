import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('SetupPage', () => {
  it('fills the details from the join request', async () => {
    await renderApp('/setup')
    expect(await screen.findByLabelText('اسم الصيدلية')).toHaveValue('صيدلية الشفاء')
    expect(screen.getByLabelText('المدينة')).toHaveValue('غزة')
  })

  it('saves and moves on according to the chosen start', async () => {
    const { router } = await renderApp('/setup')
    await userEvent.click(await screen.findByRole('radio', { name: /جربي ببيانات تجريبية/ }))
    await userEvent.click(screen.getByRole('button', { name: 'جهزي صيدليتي' }))
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'أهلاً رزان، صيدلية الشفاء جاهزة تقريباً',
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/getting-started')
    // Sample data counts as products imported: 3 of 6 done.
    expect(screen.getByText('3 من 6')).toBeInTheDocument()
  })

  it('asks a signed-out visitor to sign in first', async () => {
    localStorage.setItem('mockRole', 'none')
    const { router } = await renderApp('/setup')
    await screen.findByRole('heading', { level: 1, name: 'أهلاً فيكِ من جديد' })
    expect(router.state.location.pathname).toBe('/login')
  })
})
