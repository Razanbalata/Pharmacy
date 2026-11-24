import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '@test/render'

describe('ProductLabelsPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('gives a product with no barcode an internal code and keeps it', async () => {
    await renderApp('/products/labels?ids=5,6')
    expect(
      await screen.findByText(
        'Insulin NovoRapid FlexPen ما إله باركود، النظام ولّد إله رمز داخلي وحفظه على الصنف.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('2000000000060').length).toBeGreaterThan(0)
    expect(screen.getAllByText('5000123456789').length).toBeGreaterThan(0)
  })

  it('prints as many labels as the copies asked for', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    await renderApp('/products/labels?ids=5,6')
    const button = await screen.findByRole('button', { name: 'طباعة 2 ملصق' })
    await userEvent.click(
      await screen.findByRole('button', { name: 'زيادة نسخة: Ventolin Inhaler 100mcg' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'زيادة نسخة: Ventolin Inhaler 100mcg' }),
    )
    expect(button).toHaveAccessibleName('طباعة 4 ملصق')
    const preview = screen.getByRole('region', { name: 'المعاينة' })
    expect(within(preview).getAllByText('24.00 ₪')).toHaveLength(3)

    await userEvent.click(button)
    expect(print).toHaveBeenCalledOnce()
  })

  it('adds products by search and removes them', async () => {
    await renderApp('/products/labels?ids=5')
    await screen.findByRole('button', { name: 'طباعة 1 ملصق' })
    await userEvent.type(screen.getByRole('searchbox'), 'brufen')
    await userEvent.click(await screen.findByRole('button', { name: '+ Brufen 400mg 30 Tablets' }))
    expect(await screen.findByRole('button', { name: 'طباعة 2 ملصق' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'شيلي Ventolin Inhaler 100mcg' }))
    expect(await screen.findByRole('button', { name: 'طباعة 1 ملصق' })).toBeInTheDocument()
  })
})
