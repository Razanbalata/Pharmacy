import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@test/render'
import type { CurrentUser } from '@/entities/session'
import { Topbar } from './Topbar'

const manager: CurrentUser = {
  id: 1,
  name: 'رزان',
  phone: '0599920307',
  role: 'manager',
  discountLimit: null,
  permissions: { sellOnCredit: true, seePurchasePrice: true, approveCounts: true },
  pharmacy: {
    id: 1,
    name: 'صيدلية الشفاء',
    plan: 'trial',
    planEndsAt: '2999-01-01',
    onboardingDone: true,
  },
}

describe('Topbar', () => {
  it('opens the search palette from the search box', async () => {
    const onOpenSearch = vi.fn<() => void>()
    renderWithProviders(
      <Topbar user={manager} onOpenMenu={vi.fn<() => void>()} onOpenSearch={onOpenSearch} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /ابحثي/ }))
    expect(onOpenSearch).toHaveBeenCalledOnce()
  })

  it('names the bell with the number of new alerts', async () => {
    renderWithProviders(
      <Topbar user={manager} onOpenMenu={vi.fn<() => void>()} onOpenSearch={vi.fn<() => void>()} />,
    )
    expect(await screen.findByRole('link', { name: 'التنبيهات، 8 جديدة' })).toHaveAttribute(
      'href',
      '/alerts',
    )
  })

  it('has no bell for the cashier', () => {
    renderWithProviders(
      <Topbar
        user={{ ...manager, role: 'cashier' }}
        onOpenMenu={vi.fn<() => void>()}
        onOpenSearch={vi.fn<() => void>()}
      />,
    )
    expect(screen.queryByRole('link', { name: /التنبيهات/ })).not.toBeInTheDocument()
  })

  it('opens the menu on small screens', async () => {
    const onOpenMenu = vi.fn<() => void>()
    renderWithProviders(
      <Topbar user={manager} onOpenMenu={onOpenMenu} onOpenSearch={vi.fn<() => void>()} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'فتح القائمة' }))
    expect(onOpenMenu).toHaveBeenCalledOnce()
  })
})
