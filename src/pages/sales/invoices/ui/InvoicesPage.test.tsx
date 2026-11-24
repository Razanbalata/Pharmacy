import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function rows() {
  const table = await screen.findByRole('table', { name: 'الفواتير' })
  await within(table).findAllByRole('link')
  return within(table).getAllByRole('row').slice(1)
}

describe('InvoicesPage', () => {
  it("lists today's invoices newest first with the day's totals", async () => {
    await renderApp('/sales/invoices')
    const list = await rows()
    expect(list).toHaveLength(6)
    expect(within(list[0]!).getByRole('link', { name: 'INV-000245' })).toHaveAttribute(
      'href',
      '/sales/invoices/245',
    )
    expect(within(list[2]!).getByText('أبو أحمد الشوا')).toBeInTheDocument()
    expect(screen.getByText('488.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('نقدي 296.00 · تطبيق 73.00 · آجل 119.00')).toBeInTheDocument()
  })

  it('filters by payment method and finds a customer', async () => {
    await renderApp('/sales/invoices')
    await rows()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'طريقة الدفع' }), 'آجل')
    await within(screen.getByRole('table')).findByText('أبو أحمد الشوا')
    expect(await rows()).toHaveLength(1)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'طريقة الدفع' }), '')
    await userEvent.type(screen.getByRole('searchbox'), 'محمود')
    await within(screen.getByRole('table')).findByText('محمود عياد')
    expect(await rows()).toHaveLength(1)
  })

  it('shows yesterday on its own', async () => {
    await renderApp('/sales/invoices')
    await rows()
    await userEvent.click(screen.getByRole('radio', { name: 'أمس' }))
    await within(screen.getByRole('table')).findByText('INV-000239')
    expect(await rows()).toHaveLength(2)
  })
})
