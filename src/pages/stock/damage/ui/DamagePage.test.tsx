import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('DamagePage', () => {
  it("shows the month's loss, the top reason and expired stock still on the shelf", async () => {
    await renderApp('/stock/damage')
    expect(await screen.findByText('168.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('الشهر الماضي 358.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('3 من 6')).toBeInTheDocument()
    expect(screen.getByText(/Cough Syrup 120ml \(4 عبوة\)/)).toBeInTheDocument()
    const list = await screen.findByRole('table', { name: 'سجل التالف · هالشهر' })
    expect(within(list).getAllByRole('row')).toHaveLength(7)
  })

  it('writes off every expired batch in one step', async () => {
    await renderApp('/stock/damage')
    await userEvent.click(await screen.findByRole('button', { name: 'سجّلي الكل تالف' }))
    expect(await screen.findByText('انسجلت 1 دفعات تالف بخسارة 36.00 ₪')).toBeInTheDocument()
    expect(await screen.findByText('204.00 ₪')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'سجّلي الكل تالف' })).not.toBeInTheDocument()
  })

  it('records damage for a batch and takes it out of stock', async () => {
    const { router } = await renderApp('/stock/damage?product=17')
    const form = await screen.findByRole('form', { name: 'تسجيل تالف' })
    expect(await within(form).findByRole('combobox', { name: 'الصنف' })).toHaveValue(
      'Zyrtec 10mg 20 Tablets',
    )
    const quantity = within(form).getByLabelText('الكمية')
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '10')
    await userEvent.click(within(form).getByRole('button', { name: 'سجّلي التالف' }))
    expect(within(form).getByText('الكمية أكبر من الموجود بالدفعة')).toBeInTheDocument()

    await userEvent.clear(quantity)
    await userEvent.type(quantity, '1')
    await userEvent.click(within(form).getByRole('radio', { name: 'مكسور أو مفتوح' }))
    expect(within(form).getByText('1 × 18.00 = 18.00 ₪')).toBeInTheDocument()
    await userEvent.click(within(form).getByRole('button', { name: 'سجّلي التالف' }))
    expect(await screen.findByText('انسجل 1 علبة من Zyrtec 10mg 20 Tablets تالف')).toBeVisible()

    await router.navigate('/products/17')
    const stat = (await screen.findByText('الكمية', { selector: 'p' })).parentElement!
    expect(within(stat).getByText('3 علبة')).toBeInTheDocument()
  })
})
