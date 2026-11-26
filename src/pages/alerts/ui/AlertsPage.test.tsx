import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { http } from '@/shared/api'
import { renderApp } from '@test/render'

const group = (name: RegExp) => screen.findByRole('region', { name })

describe('AlertsPage', () => {
  it('groups the alerts, each with the button that fixes it', async () => {
    await renderApp('/alerts')
    expect(await screen.findByText(/8 جداد من آخر مرة فتحتي/)).toBeInTheDocument()

    const expiry = within(await group(/^الصلاحية · 4$/))
    expect(expiry.getByText('دفعة منتهية لسا بالمخزون')).toBeInTheDocument()
    expect(
      expiry.getByRole('link', { name: 'سجّلي تالف: دفعة منتهية لسا بالمخزون' }),
    ).toHaveAttribute('href', '/stock/damage')
    expect(
      expiry.getByRole('link', {
        name: 'اعرضي الصنف: Azithromycin 500mg 3 Tablets بينتهي بعد 5 يوم',
      }),
    ).toHaveAttribute('href', '/products/3')

    const shortage = within(await group(/^النقص/))
    expect(shortage.getByText(/موجود بالمسودة PO-0015/)).toBeInTheDocument()
    expect(shortage.getByRole('link', { name: /^افتحي الطلبية/ })).toHaveAttribute(
      'href',
      '/purchases/15',
    )
    const debts = within(await group(/^الديون · 2$/))
    expect(
      debts.getByRole('link', { name: 'كشف الحساب: نادية الحلو تجاوز حد الدين' }),
    ).toHaveAttribute('href', '/customers/5')
    expect(
      within(await group(/^المشتريات/)).getByText('PO-0014 بانتظار الاستلام'),
    ).toBeInTheDocument()
  })

  it('filters by type, and marks everything read', async () => {
    await renderApp('/alerts')
    await userEvent.click(await screen.findByRole('radio', { name: 'الديون · 2' }))
    expect(
      screen.getAllByRole('region', { name: /^(الصلاحية|النقص|الديون|المشتريات|النظام) · / }),
    ).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'تعليم الكل كمقروء' }))
    expect(await screen.findByText(/ما في جديد. كل التنبيهات مقروءة./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'التنبيهات، 0 جديدة' })).toBeInTheDocument()
  })

  it('marks an alert read as its button is followed', async () => {
    const { router } = await renderApp('/alerts')
    await userEvent.click(await screen.findByRole('link', { name: /^الاشتراك:/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/settings'))
    expect(await screen.findByRole('button', { name: 'التنبيهات، 7 جديدة' })).toBeInTheDocument()
  })

  it('drops an alert once the problem is fixed', async () => {
    await http.post('/api/stock/damage/expired')
    await renderApp('/alerts')
    const expiry = within(await group(/^الصلاحية/))
    expect(expiry.queryByText('دفعة منتهية لسا بالمخزون')).not.toBeInTheDocument()
  })

  it('is not for the cashier', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await renderApp('/alerts')
    expect(await screen.findByText('هالصفحة مش ضمن صلاحياتك')).toBeInTheDocument()
  })
})
