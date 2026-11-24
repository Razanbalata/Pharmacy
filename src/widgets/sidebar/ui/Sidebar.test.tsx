import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@test/render'
import type { CurrentUser } from '@/entities/session'
import { Sidebar } from './Sidebar'

const base: CurrentUser = {
  id: 1,
  name: 'رزان',
  phone: '0599920307',
  role: 'manager',
  discountLimit: null,
  pharmacy: { id: 1, name: 'صيدلية الشفاء', plan: 'trial', planEndsAt: '2999-01-01' },
}

describe('Sidebar', () => {
  it('shows every group to the manager and marks the current page', () => {
    renderWithProviders(<Sidebar user={base} />, { route: '/products' })
    const nav = screen.getByRole('navigation', { name: 'القائمة الرئيسية' })
    expect(within(nav).getByRole('link', { name: 'الأصناف' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'الإعدادات' })).toBeInTheDocument()
  })

  it('hides admin and money from the cashier', () => {
    renderWithProviders(<Sidebar user={{ ...base, role: 'cashier' }} />)
    expect(screen.queryByRole('link', { name: 'الموظفون' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'التقارير' })).not.toBeInTheDocument()
    expect(screen.queryByText('المساعد الذكي')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'نقطة البيع' })).toBeInTheDocument()
  })

  it('shows the unread alert count from the server', async () => {
    renderWithProviders(<Sidebar user={base} />)
    expect(await screen.findByText('8')).toBeInTheDocument()
  })

  it('says when the free trial has ended', () => {
    renderWithProviders(
      <Sidebar user={{ ...base, pharmacy: { ...base.pharmacy, planEndsAt: '2000-01-01' } }} />,
    )
    expect(screen.getByText('انتهت التجربة المجانية')).toBeInTheDocument()
  })
})
