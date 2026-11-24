import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function rows() {
  const table = await screen.findByRole('table', { name: 'سجل الحركات' })
  await within(table).findAllByRole('link')
  return within(table).getAllByRole('row').slice(1)
}

describe('MovementsPage', () => {
  it('lists every movement of the last 30 days with totals in and out', async () => {
    await renderApp('/stock/movements')
    const all = await rows()
    // The two newest are the same invoice, at the same minute.
    const newest = all.slice(0, 2).map((row) => within(row).getAllByRole('link')[0]?.textContent)
    expect(newest.sort()).toEqual(['Augmentin 625mg 14 Tablets', 'Panadol Extra 24 Tablets'])
    expect(within(all[0]!).getByText('INV-000245')).toBeInTheDocument()
    expect(screen.getByText('+ 21 وحدة')).toBeInTheDocument()
    expect(screen.getByText('− 22 وحدة')).toBeInTheDocument()
    expect(screen.getByText('− 15')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PO-0012' })).toHaveAttribute('href', '/purchases/12')
  })

  it('filters by type and by staff member', async () => {
    await renderApp('/stock/movements')
    await rows()
    await userEvent.click(screen.getByRole('button', { name: 'تالف' }))
    expect(screen.getByRole('button', { name: 'تالف' })).toHaveAttribute('aria-pressed', 'true')
    await within(screen.getByRole('table')).findByText('Omeprazole 20mg 28 Capsules')
    expect(await rows()).toHaveLength(6)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'الموظف' }), 'سارة يوسف')
    await within(screen.getByRole('table')).findByText('Vitamin D3 1000IU 30 Capsules')
    expect(await rows()).toHaveLength(3)
  })
})
