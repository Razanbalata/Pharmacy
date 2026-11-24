import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '@test/render'

describe('PurchaseOrderPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it("starts an order with the supplier's shortages and saves it as a draft", async () => {
    const { router } = await renderApp('/purchases/new?supplier=1')
    expect(await screen.findByText('مستحق إله: 650.00 ₪')).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('button', { name: '+ نواقص هالمورد · 4' }))
    const lines = screen.getByRole('table', { name: 'الصنف' })
    expect(within(lines).getAllByRole('row')).toHaveLength(5)
    await userEvent.click(screen.getByRole('button', { name: 'شيلي Curam 1g 14 Tablets' }))
    await userEvent.click(screen.getByRole('button', { name: 'زيدي Zyrtec 10mg 20 Tablets' }))
    expect(screen.getByLabelText('كمية Zyrtec 10mg 20 Tablets')).toHaveValue('7')
    expect(screen.getByText('3 أصناف · 27 وحدة')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'حفظ كمسودة' }))
    expect(await screen.findByText('انحفظ PO-0016')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'طلب شراء PO-0016' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/purchases/16')
  })

  it('needs a supplier and at least one product', async () => {
    await renderApp('/purchases/new')
    await userEvent.click(await screen.findByRole('button', { name: 'حفظ كمسودة' }))
    expect(screen.getByRole('alert')).toHaveTextContent('اختاري المورد أول')
    await userEvent.click(screen.getByRole('combobox', { name: 'المورد' }))
    await userEvent.click(await screen.findByRole('option', { name: 'مستودع النور' }))
    await userEvent.click(screen.getByRole('button', { name: 'حفظ كمسودة' }))
    expect(screen.getByRole('alert')).toHaveTextContent('الطلب فاضي')
  })

  it('sends a draft on WhatsApp, after which it cannot change', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    await renderApp('/purchases/15')
    await userEvent.click(await screen.findByRole('button', { name: 'ابعتي الطلب للمورد واتساب' }))
    expect(await screen.findByText('انبعت PO-0015 للمورد')).toBeInTheDocument()
    const link = String(open.mock.calls[0]?.[0])
    expect(link).toContain('https://wa.me/970599111222?text=')
    expect(decodeURIComponent(link)).toContain('Ventolin Inhaler 100mcg × 20')
    expect(await screen.findByText('مرسل · بانتظار الاستلام')).toBeInTheDocument()
    expect(screen.getByText(/الطلب انبعت، فما بيتعدل/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'استلام' })).toHaveAttribute(
      'href',
      '/purchases/15/receive',
    )
  })

  it('cancels a sent order that nothing arrived for', async () => {
    await renderApp('/purchases/14')
    await userEvent.click(await screen.findByRole('button', { name: 'إلغاء الطلب' }))
    const dialog = screen.getByRole('dialog', { name: 'إلغاء PO-0014؟' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'إلغاء الطلب' }))
    expect(await screen.findByText('انلغى PO-0014')).toBeInTheDocument()
    expect(await screen.findByText('ملغي')).toBeInTheDocument()
  })

  it('shows a received order with its values, and no way to cancel it', async () => {
    await renderApp('/purchases/12')
    expect(await screen.findByRole('heading', { name: 'طلب شراء PO-0012' })).toBeInTheDocument()
    expect(screen.getAllByText('920.00 ₪')).toHaveLength(2)
    expect(screen.getByText('500.00 ₪')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'إلغاء الطلب' })).not.toBeInTheDocument()
  })
})
