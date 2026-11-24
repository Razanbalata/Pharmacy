import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '@test/render'

describe('ReturnsPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('finds the invoice by its number', async () => {
    await renderApp('/sales/returns')
    await userEvent.type(await screen.findByLabelText('رقم الفاتورة'), '999')
    await userEvent.click(screen.getByRole('button', { name: 'ابحثي' }))
    expect(await screen.findByText('ما لقينا فاتورة بهالرقم.')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('رقم الفاتورة'))
    await userEvent.type(screen.getByLabelText('رقم الفاتورة'), 'INV-000241')
    await userEvent.click(screen.getByRole('button', { name: 'ابحثي' }))
    expect(await screen.findByText(/INV-000241 ·/)).toBeInTheDocument()
    expect(screen.getByText(/محمود عياد · 103.00 ₪/)).toBeInTheDocument()
    expect(screen.getByText(/ضمن مدة الإرجاع/)).toBeInTheDocument()
  })

  it('returns one item to stock and writes another off, off the customer debt', async () => {
    vi.spyOn(window, 'print').mockImplementation(() => {})
    const { router } = await renderApp('/sales/returns?invoice=241')
    await userEvent.click(
      await screen.findByRole('button', { name: 'زيدي Glucophage 500mg 50 Tablets' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'زيدي Vitamin D3 1000IU 30 Capsules' }),
    )
    await userEvent.click(
      within(
        screen.getByRole('group', { name: 'وين بيروح Vitamin D3 1000IU 30 Capsules' }),
      ).getByRole('radio', { name: 'تالف' }),
    )
    await userEvent.selectOptions(
      screen.getByLabelText('سبب إرجاع Vitamin D3 1000IU 30 Capsules'),
      'تالف أو مفتوح',
    )
    await userEvent.click(screen.getByRole('radio', { name: 'خصم من دين محمود عياد' }))
    expect(screen.getByText('61.00 ₪')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'تأكيد المرتجع' }))

    expect(await screen.findByText('انعمل المرتجع RT-0013 بـ 61.00 ₪')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/sales/invoices/241'))
    expect(await screen.findByText('مرتجع جزئي')).toBeInTheDocument()
    expect(screen.getAllByText('رجع 1')).toHaveLength(2)
  })

  it('needs something to return and someone to approve it', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await renderApp('/sales/returns?invoice=244')
    await userEvent.click(await screen.findByRole('button', { name: 'تأكيد المرتجع' }))
    expect(screen.getByRole('alert')).toHaveTextContent('اختاري كمية راجعة')
    await userEvent.click(screen.getByRole('button', { name: 'زيدي Adol Syrup 120ml' }))
    await userEvent.click(screen.getByRole('button', { name: 'تأكيد المرتجع' }))
    expect(screen.getByRole('alert')).toHaveTextContent('اختاري مين وافق على المرتجع.')
  })
})
