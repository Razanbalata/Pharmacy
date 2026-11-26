import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { http } from '@/shared/api'
import { renderApp } from '@test/render'

async function asManager() {
  await http.post('/api/onboarding/dismiss')
  return renderApp('/')
}

describe('DashboardPage', () => {
  it("shows the manager what needs her and today's numbers", async () => {
    await asManager()
    expect(await screen.findByText(/4 أشياء بدها انتباهك/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /دفعة منتهية على الرف/ })).toHaveAttribute(
      'href',
      '/stock/damage',
    )
    expect(screen.getByRole('link', { name: /2 أصناف بتنتهي خلال 30 يوم/ })).toHaveAttribute(
      'href',
      '/products?tab=soon',
    )
    expect(screen.getByRole('link', { name: /ديون متأخرة 530.00 ₪/ })).toHaveAttribute(
      'href',
      '/customers',
    )

    const sales = screen.getByRole('link', { name: /مبيعات اليوم/ })
    expect(within(sales).getByText('488.00 ₪')).toBeInTheDocument()
    expect(within(sales).getByText('6 فاتورة · أمس 39.00 ₪')).toBeInTheDocument()
    const profit = screen.getByRole('link', { name: /إجمالي ربح اليوم/ })
    expect(within(profit).getByText('قبل المصاريف · هامش 31%')).toBeInTheDocument()
    expect(
      within(screen.getByRole('link', { name: /النقد بالدرج/ })).getByText('496.00 ₪'),
    ).toBeVisible()

    const notes = screen.getByRole('region', { name: /ملاحظات سريعة/ })
    expect(within(notes).getByText(/بالمسودة PO-0015/)).toBeInTheDocument()
    const today = screen.getByRole('region', { name: 'شو صار اليوم' })
    expect(within(today).getAllByRole('listitem')).toHaveLength(6)
    expect(within(today).getByText('محمد باع فاتورة بـ 196.00 ₪')).toBeInTheDocument()
  })

  it('draws sales per day, with a table of the same numbers', async () => {
    await asManager()
    const trend = await screen.findByRole('region', { name: 'اتجاه المبيعات' })
    const table = await within(trend).findByRole('table', { name: 'مبيعات كل يوم' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(7)
    expect(within(rows[6]!).getByText('اليوم')).toBeInTheDocument()
    expect(within(rows[6]!).getByText('488.00')).toBeInTheDocument()
    expect(within(rows[3]!).getByText('2,745.00')).toBeInTheDocument()
    expect(within(trend).getByText(/المجموع 12,447.00 ₪/)).toBeInTheDocument()

    await userEvent.click(within(trend).getByRole('radio', { name: 'آخر 30 يوم' }))
    expect(await within(trend).findByText(/آخر 30 يوم · بالشيكل/)).toBeInTheDocument()
    expect(within(within(trend).getByRole('table')).getAllByRole('row')).toHaveLength(30)
  })

  it("gives the pharmacist today's tasks and lists, without profit", async () => {
    localStorage.setItem('mockRole', 'pharmacist')
    await renderApp('/')
    const tasks = await screen.findByRole('region', { name: 'مهام اليوم' })
    expect(within(tasks).getByText('دفعة منتهية لسا على الرف')).toBeInTheDocument()
    expect(within(tasks).getByText('5 من 6 · فيه 4 فروقات')).toBeInTheDocument()
    expect(within(tasks).getByRole('link', { name: /^استلمي/ })).toHaveAttribute(
      'href',
      '/purchases/14/receive',
    )
    const soon = screen.getByRole('region', { name: 'بينتهي قريباً' })
    expect(within(soon).getByText('Azithromycin 500mg 3 Tablets')).toBeInTheDocument()
    const low = screen.getByRole('region', { name: 'ناقص' })
    expect(within(low).getByRole('link', { name: 'الكل · 7' })).toHaveAttribute(
      'href',
      '/products?tab=low',
    )
    expect(screen.queryByText(/إجمالي ربح اليوم/)).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'مبيعاتي اليوم' })).toHaveTextContent('0.00 ₪')
  })

  it('shows the cashier her own sales and the way to the till', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await renderApp('/')
    const mine = await screen.findByRole('region', { name: 'مبيعاتي اليوم' })
    expect(within(mine).getByText('488.00 ₪')).toBeInTheDocument()
    expect(within(mine).getByText(/6 فاتورة · الوردية 14 مفتوحة/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'مهام اليوم' })).not.toBeInTheDocument()
  })

  it('opens the smart analysis in place, without leaving the dashboard', async () => {
    const { router } = await asManager()
    await userEvent.click(await screen.findByRole('button', { name: 'تحليل ذكي' }))
    expect(await screen.findByRole('dialog', { name: 'التحليل الذكي' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/')
  })
})
