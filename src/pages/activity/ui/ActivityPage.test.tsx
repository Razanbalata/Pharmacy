import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('ActivityPage', () => {
  it("shows today's activity as sentences with who and when", async () => {
    await renderApp('/staff/activity')
    expect(await screen.findByText('عمل خصم 5 ₪ على فاتورة INV-000245')).toBeInTheDocument()
    expect(screen.getByText('غيّر مدة تنبيه الصلاحية من 60 إلى 90')).toBeInTheDocument()
    expect(screen.queryByText('أوقف حساب أحمد شحادة')).not.toBeInTheDocument()
  })

  it('widens to the month', async () => {
    await renderApp('/staff/activity')
    await screen.findByText('عمل خصم 5 ₪ على فاتورة INV-000245')
    await userEvent.click(screen.getByRole('radio', { name: 'هالشهر' }))
    expect(await screen.findByText('أوقف حساب أحمد شحادة')).toBeInTheDocument()
  })

  it('filters by staff member and to sensitive actions only', async () => {
    await renderApp('/staff/activity')
    await screen.findByText('عمل خصم 5 ₪ على فاتورة INV-000245')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'الموظف' }), 'سارة يوسف')
    await userEvent.click(screen.getByRole('checkbox', { name: 'حساس بس' }))
    const list = await screen.findByRole('list')
    expect(await within(list).findAllByRole('listitem')).toHaveLength(2)
    expect(within(list).getByText('سجّل تالف: أوميغا 3')).toBeInTheDocument()
  })

  it('finds an invoice by its number', async () => {
    await renderApp('/staff/activity')
    await screen.findByText('عمل خصم 5 ₪ على فاتورة INV-000245')
    await userEvent.type(screen.getByRole('searchbox'), '241')
    expect(await screen.findByText('وافق على مرتجع من INV-000241')).toBeInTheDocument()
    expect(screen.queryByText('عمل خصم 5 ₪ على فاتورة INV-000245')).not.toBeInTheDocument()
  })
})
