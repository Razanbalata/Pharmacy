import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function table() {
  const found = await screen.findByRole('table', { name: 'الأصناف' })
  await within(found).findAllByRole('link')
  return found
}

function names(found: HTMLElement) {
  return within(found)
    .getAllByRole('row')
    .slice(1)
    .map((tr) => within(tr).getAllByRole('link')[0]?.textContent)
}

describe('ProductsPage', () => {
  it('lists products nearest expiry first, with a count on every tab', async () => {
    await renderApp('/products')
    const found = await table()
    expect(names(found)[0]).toBe('Cough Syrup 120ml')
    expect(
      screen.getByText('22 صنف. اضغطي على أي صنف لتشوفي دفعاته وحركاته وبدائله.'),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'ناقص 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'منتهي 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'موقوف 2' })).toBeInTheDocument()
  })

  it('shows only the products below their minimum on the low tab', async () => {
    await renderApp('/products')
    await table()
    await userEvent.click(screen.getByRole('button', { name: 'ناقص 3' }))
    expect(screen.getByRole('button', { name: 'ناقص 3' })).toHaveAttribute('aria-pressed', 'true')
    await within(screen.getByRole('table')).findByText('Zyrtec 10mg 20 Tablets')
    expect(names(screen.getByRole('table')).sort()).toEqual([
      'Insulin NovoRapid FlexPen',
      'Ventolin Inhaler 100mcg',
      'Zyrtec 10mg 20 Tablets',
    ])
  })

  it('finds products by name, and by an exact barcode', async () => {
    await renderApp('/products')
    await table()
    await userEvent.type(screen.getByRole('searchbox'), 'augmentin')
    await within(screen.getByRole('table')).findByText('Augmentin 1g 14 Tablets')
    expect(names(screen.getByRole('table'))).toHaveLength(3)

    await userEvent.clear(screen.getByRole('searchbox'))
    await userEvent.type(screen.getByRole('searchbox'), '5000123456789')
    await within(screen.getByRole('table')).findByText('Ventolin Inhaler 100mcg')
    expect(names(screen.getByRole('table'))).toEqual(['Ventolin Inhaler 100mcg'])
  })

  it('shows what can be done to ticked products', async () => {
    await renderApp('/products')
    await table()
    await userEvent.click(screen.getByRole('checkbox', { name: 'تحديد Zyrtec 10mg 20 Tablets' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'تحديد Ventolin Inhaler 100mcg' }))
    const bar = screen.getByRole('region', { name: '2 أصناف محددة' })
    expect(within(bar).getByRole('link', { name: 'طباعة ملصقات' })).toHaveAttribute(
      'href',
      '/products/labels?ids=17,5',
    )
    await userEvent.click(within(bar).getByRole('button', { name: 'إلغاء التحديد' }))
    expect(screen.queryByRole('region', { name: '2 أصناف محددة' })).not.toBeInTheDocument()
  })

  it('lets the cashier look products up without changing them', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await renderApp('/products')
    await table()
    expect(screen.queryByRole('link', { name: '+ إضافة صنف' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^تعديل/ })).not.toBeInTheDocument()
  })
})
