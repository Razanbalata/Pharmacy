import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function table() {
  const found = await screen.findByRole('table', { name: 'طلبات الشراء' })
  await within(found).findByText('PO-0015')
  return found
}

function numbers(found: HTMLElement) {
  return within(found)
    .getAllByRole('row')
    .slice(1)
    .map((tr) => within(tr).getAllByRole('link')[0]?.textContent)
}

describe('PurchasesPage', () => {
  it('lists orders newest first, each with its next step', async () => {
    await renderApp('/purchases')
    const found = await table()
    expect(numbers(found)).toEqual([
      'PO-0015',
      'PO-0014',
      'PO-0013',
      'PO-0012',
      'PO-0011',
      'PO-0010',
    ])
    expect(screen.getByRole('link', { name: 'إكمال PO-0015' })).toHaveAttribute(
      'href',
      '/purchases/15',
    )
    expect(screen.getByRole('link', { name: 'استلام PO-0014' })).toHaveAttribute(
      'href',
      '/purchases/14/receive',
    )
    expect(screen.getByRole('link', { name: 'استلام الباقي PO-0013' })).toBeInTheDocument()
    const po12 = within(within(found).getByText('PO-0012').closest('tr')!)
    expect(po12.getByText('مستلم')).toBeInTheDocument()
    expect(po12.getByText('مدفوع جزئياً')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    await renderApp('/purchases')
    await table()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'الحالة' }), 'مستلم')
    await within(screen.getByRole('table')).findByText('PO-0011')
    expect(numbers(screen.getByRole('table'))).toEqual(['PO-0012', 'PO-0011'])
  })

  it('prepares draft orders for products below their minimum', async () => {
    await renderApp('/purchases')
    await table()
    expect(await screen.findByText(/5 صنف تحت الحد الأدنى/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'راجعي الطلبيات المقترحة' }))
    const dialog = screen.getByRole('dialog', { name: 'الطلبيات المقترحة' })
    expect(within(dialog).getByText('Zyrtec 10mg 20 Tablets')).toBeInTheDocument()
    expect(within(dialog).queryByText('Ventolin Inhaler 100mcg')).not.toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'جهّزي طلبية مستودع النور' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'جهّزي 1 طلبيات كمسودة' }))

    expect(await screen.findByText('انعملت 1 مسودات')).toBeInTheDocument()
    const row = within(
      (await within(screen.getByRole('table')).findByText('PO-0016')).closest('tr')!,
    )
    expect(row.getByText('المستودع الطبي الحديث')).toBeInTheDocument()
    expect(row.getByText('4')).toBeInTheDocument()
    expect(await screen.findByText(/1 صنف تحت الحد الأدنى/)).toBeInTheDocument()
  })
})
