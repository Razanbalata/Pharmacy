import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('InvoiceDetailPage', () => {
  it('shows the lines, totals, payment and profit of an invoice', async () => {
    await renderApp('/sales/invoices/245')
    expect(await screen.findByRole('heading', { name: 'INV-000245' })).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'INV-000245' })
    expect(within(table).getAllByRole('row')).toHaveLength(5)
    expect(within(table).getByText('شريط')).toBeInTheDocument()
    expect(screen.getByText('196.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('− 5.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('200.00 · 4.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('أنشأها محمد سالم')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'عمل مرتجع' })).toHaveAttribute(
      'href',
      '/sales/returns?invoice=245',
    )
  })

  it('hides the profit from the cashier, and reprints the receipt', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await renderApp('/sales/invoices/241')
    await screen.findByRole('heading', { name: 'INV-000241' })
    expect(screen.getByText('مخفي')).toBeInTheDocument()
    expect(screen.getByText('نقدي 60.00 · تطبيق 43.00 · آجل 0.00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'إرسال واتساب' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/970597223344'),
    )
    await userEvent.click(screen.getByRole('button', { name: 'إعادة طباعة' }))
    const receipt = await screen.findByRole('dialog', { name: 'الإيصال' })
    expect(within(receipt).getByText('Vitamin D3 1000IU 30 Capsules')).toBeInTheDocument()
  })
})
