import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('ProductDetailPage', () => {
  it('shows stock, batches nearest expiry first, units, movements and alternatives', async () => {
    await renderApp('/products/1')
    expect(
      await screen.findByRole('heading', { name: 'Augmentin 625mg 14 Tablets' }),
    ).toBeInTheDocument()
    expect(screen.getByText('38 علبة')).toBeInTheDocument()
    expect(screen.getByText('27.21')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()

    const batches = screen.getByRole('table', { name: 'الدفعات' })
    const rows = within(batches).getAllByRole('row')
    expect(within(rows[1]!).getByText('A-2291')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('البيع الجاي منها')).toBeInTheDocument()
    expect(within(rows[2]!).queryByText('البيع الجاي منها')).not.toBeInTheDocument()

    expect(screen.getByText(/علبة = 2 شريط/)).toBeInTheDocument()
    expect(screen.getByText('حبة · البيع فيها موقوف')).toBeInTheDocument()
    expect(screen.getByText('INV-000245')).toBeInTheDocument()

    const alternatives = screen.getByRole('heading', {
      name: 'البدائل بنفس المادة الفعالة',
    }).parentElement!
    expect(
      within(alternatives).getByRole('link', { name: 'Amoclan 1g 14 Tablets' }),
    ).toHaveAttribute('href', '/products/12')
    expect(within(alternatives).queryByText('Augmentin 375mg Tablets')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'تعديل' })).toHaveAttribute('href', '/products/1/edit')
  })

  it('hides purchase prices and editing from the cashier', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await renderApp('/products/1')
    await screen.findByRole('heading', { name: 'Augmentin 625mg 14 Tablets' })
    expect(screen.getByText('مخفي حسب صلاحيتك')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'سعر الشراء' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'تعديل' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'بيع' })).toBeInTheDocument()
  })

  it('says when a product has no active ingredient to find alternatives by', async () => {
    await renderApp('/products/22')
    await screen.findByRole('heading', { name: 'Strepsils Honey Lemon 24' })
    expect(screen.getByText(/ما إله مادة فعالة/)).toBeInTheDocument()
  })

  it('says so when the product does not exist', async () => {
    await renderApp('/products/999')
    expect(await screen.findByText(/الصنف مش موجود/)).toBeInTheDocument()
  })
})
