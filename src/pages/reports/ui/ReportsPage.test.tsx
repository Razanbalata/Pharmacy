import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '@test/render'

const card = (name: string | RegExp) => screen.findByRole('region', { name })

describe('ReportsPage', () => {
  it("sums the month's sales, by day, payment and staff", async () => {
    await renderApp('/reports')
    expect(await screen.findByRole('heading', { name: 'تقرير المبيعات' })).toBeInTheDocument()
    expect(await screen.findByText('16,172.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('380')).toBeInTheDocument()
    expect(screen.getByText('42.56 ₪')).toBeInTheDocument()

    const daily = within(await card('المبيعات اليومية'))
    const rows = daily.getAllByRole('row')
    expect(rows).toHaveLength(24)
    expect(within(rows[20]!).getByText('2,745.00')).toBeInTheDocument()

    const staff = within(await card('حسب الموظف'))
    expect(staff.getByText('9,408.00')).toBeInTheDocument()
    expect(within(await card('حسب طريقة الدفع')).getByText('9,017.00 · 56%')).toBeInTheDocument()
    const top = within(await card('الأكثر مبيعاً'))
    expect(top.getByRole('link', { name: 'Insulin NovoRapid FlexPen' })).toHaveAttribute(
      'href',
      '/products/6',
    )
  })

  it('keeps the tab and period in the address, and compares with the stretch before', async () => {
    const { router } = await renderApp('/reports')
    await screen.findByText('16,172.00 ₪')
    await userEvent.click(screen.getByRole('radio', { name: 'آخر 7 أيام' }))
    expect(router.state.location.search).toBe('?period=week')
    expect(await screen.findByText('12,447.00 ₪')).toBeInTheDocument()
    // Arabic dates carry hidden direction marks; compare without them.
    expect(
      screen.getByText((text) =>
        text.replace(/\u200f/g, '').includes('18/11 – 24/11 · مقارنة مع 11/11 – 17/11'),
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('▲ 234%').length).toBeGreaterThan(0)
  })

  it('walks from sales to net profit, with older shifts on their own line', async () => {
    await renderApp('/reports?tab=profit')
    const bridge = within(await card('من المبيعات لصافي الربح'))
    expect(bridge.getByText('الربح الإجمالي · 29.1%')).toBeInTheDocument()
    expect(bridge.getByText('− 3,450.00 ₪')).toBeInTheDocument()
    expect(bridge.getByText('1,081.00 ₪')).toBeInTheDocument()
    const categories = within(await card('الربح حسب التصنيف'))
    expect(categories.getByText('ورديات قديمة (بدون تفاصيل أصناف)')).toBeInTheDocument()
  })

  it('shows what sits on the shelves and what could be lost', async () => {
    await renderApp('/reports?tab=stock')
    expect(await screen.findByText('7,159.00 ₪')).toBeInTheDocument()
    const expiry = within(await card('الصلاحية: شو ممكن يضيع'))
    expect(
      expiry.getByRole('link', { name: /منتهي وممنوع من البيع.*1 دفعة · 36.00 ₪/ }),
    ).toHaveAttribute('href', '/stock/damage')
    const nearest = within(await card('أقرب 5 للانتهاء'))
    expect(nearest.getAllByRole('row')).toHaveLength(4)
  })

  it('weighs what customers owe against what is owed to suppliers', async () => {
    vi.spyOn(window, 'open').mockImplementation(() => null)
    await renderApp('/reports?tab=debts')
    const customers = within(await card('ديون الزبائن · إلك'))
    expect(customers.getByText('1,245.00 ₪')).toBeInTheDocument()
    expect(customers.getByText('530.00 ₪')).toBeInTheDocument()
    await userEvent.click(
      customers.getByRole('button', { name: 'ابعتي تذكير واتساب للمتأخرين (2)' }),
    )
    expect(customers.getByRole('link', { name: 'WhatsApp · نادية الحلو' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/970597552310'),
    )
    expect(
      within(await card('مستحقات الموردين · عليكِ')).getByText(/بيضل عليكِ للموردين 385.00 ₪/),
    ).toBeVisible()
  })

  it('keeps profit from the pharmacist', async () => {
    localStorage.setItem('mockRole', 'pharmacist')
    await renderApp('/reports?tab=profit')
    expect(await screen.findByRole('heading', { name: 'تقرير المبيعات' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'الأرباح' })).not.toBeInTheDocument()
  })
})
