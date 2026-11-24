import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
}

const PO14 = [
  'Glucophage 500mg 50 Tablets',
  'Panadol 500mg 24 Tablets',
  'Vitamin D3 1000IU 30 Capsules',
  'Bepanthen Cream 30g',
  'Brufen 400mg 30 Tablets',
]

describe('PurchaseReceivePage', () => {
  it('receives what arrived, adds it to stock and to the supplier account', async () => {
    const { router } = await renderApp('/purchases/14/receive')
    expect(await screen.findByRole('heading', { name: 'استلام PO-0014' })).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'تأكيد الاستلام وإضافة الدفعات للمخزون' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('في أسطر ناقصها')
    expect(screen.getAllByText('رقم الدفعة مطلوب')).toHaveLength(5)

    for (const [index, name] of PO14.entries()) {
      await userEvent.type(screen.getByLabelText(`${name}: رقم الدفعة`), `B-${index}`)
      await userEvent.type(
        screen.getByLabelText(`${name}: تاريخ الانتهاء`),
        name.startsWith('Bepanthen') ? inDays(120) : inDays(600),
      )
    }
    expect(screen.getByText(/بتنتهي خلال \d شهر/)).toBeInTheDocument()

    const vitamin = screen.getByLabelText('Vitamin D3 1000IU 30 Capsules: الواصل')
    await userEvent.clear(vitamin)
    await userEvent.type(vitamin, '15')
    expect(screen.getByText('وصل أقل من المطلوب بـ 5')).toBeInTheDocument()
    expect(screen.getAllByText('1,480.00 ₪')).toHaveLength(2)

    await userEvent.clear(screen.getByLabelText('المدفوع هلأ'))
    await userEvent.type(screen.getByLabelText('المدفوع هلأ'), '1000')
    expect(screen.getByText('480.00 ₪')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'تأكيد الاستلام وإضافة الدفعات للمخزون' }),
    )

    expect(await screen.findByText('استلمتِ PO-0014، والدفعات انضافت للمخزون')).toBeInTheDocument()
    expect(await screen.findByText('مستلم جزئياً')).toBeInTheDocument()
    expect(screen.getByText('مدفوع جزئياً')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/purchases/14')

    await router.navigate('/products/8')
    expect(await screen.findByText('67 علبة')).toBeInTheDocument()
    expect(screen.getByText('B-0')).toBeInTheDocument()

    await router.navigate('/suppliers/1')
    const invoice = await screen.findByRole('link', { name: 'فاتورة شراء PO-0014' })
    expect(within(invoice.closest('tr')!).getByText('1,480.00')).toBeInTheDocument()
  })

  it('receives the rest of a partly received order', async () => {
    await renderApp('/purchases/13/receive')
    await screen.findByRole('heading', { name: 'استلام PO-0013' })
    expect(screen.getByLabelText('Adol Syrup 120ml: الواصل')).toHaveValue('20')
    expect(screen.getByText('وصل قبل 10')).toBeInTheDocument()
    expect(screen.queryByLabelText('Omeprazole 20mg 28 Capsules: الواصل')).not.toBeInTheDocument()
  })

  it('refuses expired stock and a payment bigger than what arrived', async () => {
    await renderApp('/purchases/13/receive')
    await screen.findByRole('heading', { name: 'استلام PO-0013' })
    await userEvent.clear(screen.getByLabelText('Cough Syrup 120ml: الواصل'))
    await userEvent.type(screen.getByLabelText('Cough Syrup 120ml: الواصل'), '0')
    await userEvent.type(screen.getByLabelText('Adol Syrup 120ml: رقم الدفعة'), 'AD-1')
    await userEvent.type(screen.getByLabelText('Adol Syrup 120ml: تاريخ الانتهاء'), inDays(-3))
    await userEvent.click(
      screen.getByRole('button', { name: 'تأكيد الاستلام وإضافة الدفعات للمخزون' }),
    )
    expect(screen.getByText('التاريخ فات، ما بنستلم دوا منتهي.')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Adol Syrup 120ml: تاريخ الانتهاء'))
    await userEvent.type(screen.getByLabelText('Adol Syrup 120ml: تاريخ الانتهاء'), inDays(700))
    await userEvent.type(screen.getByLabelText('المدفوع هلأ'), '999')
    await userEvent.click(
      screen.getByRole('button', { name: 'تأكيد الاستلام وإضافة الدفعات للمخزون' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('المدفوع أكبر من قيمة الواصل')
  })

  it('says so when the order is not awaiting delivery', async () => {
    await renderApp('/purchases/12/receive')
    expect(await screen.findByText('هالطلب مش بانتظار استلام.')).toBeInTheDocument()
  })
})
