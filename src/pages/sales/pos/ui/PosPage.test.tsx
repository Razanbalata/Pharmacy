import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/api'
import { renderApp } from '@test/render'

async function openTill() {
  const result = await renderApp('/sales/pos')
  await screen.findByRole('searchbox', { name: /ابحثي بالاسم العربي/ })
  return result
}

async function search(text: string) {
  const box = screen.getByRole('searchbox', { name: /ابحثي بالاسم العربي/ })
  await userEvent.clear(box)
  await userEvent.type(box, text)
}

async function addProduct(text: string, name: string) {
  await search(text)
  await userEvent.click(await screen.findByRole('button', { name: `أضيفي ${name}` }))
  await within(cart()).findByText(name)
}

const cart = () => screen.getByRole('region', { name: 'الفاتورة الحالية' })

describe('PosPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('asks for a shift before selling', async () => {
    await http.delete('/api/sales/held/2')
    await http.delete('/api/sales/held/3')
    await http.post('/api/shifts/current/close', { countedCash: 496, note: '' })
    await renderApp('/sales/pos')
    expect(await screen.findByText('ما في وردية مفتوحة')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'افتحي وردية' })).toHaveAttribute(
      'href',
      '/sales/shift',
    )
  })

  it('finds by name, sells by strip, and prices the line by its unit', async () => {
    await openTill()
    await addProduct('augm', 'Augmentin 625mg 14 Tablets')
    expect(within(cart()).getByText('دفعة A-2291 · تنتهي 09/2027')).toBeInTheDocument()
    await userEvent.click(within(cart()).getByRole('radio', { name: 'شريط' }))
    await userEvent.click(
      within(cart()).getByRole('button', { name: 'زيدي Augmentin 625mg 14 Tablets' }),
    )
    await userEvent.click(
      within(cart()).getByRole('button', { name: 'زيدي Augmentin 625mg 14 Tablets' }),
    )
    expect(within(cart()).getAllByText('60.00 ₪')).toHaveLength(3)
  })

  it('offers alternatives with the same ingredient when a product is out', async () => {
    await openTill()
    await search('moxiclav')
    expect(await screen.findByText('نافد. بدائل متوفرة بنفس المادة:')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'أضيفي Augmentin 1g 14 Tablets' }))
    expect(await within(cart()).findByText('Augmentin 1g 14 Tablets')).toBeInTheDocument()
  })

  it('adds a scanned barcode straight away', async () => {
    await openTill()
    await search('5000123456789')
    await screen.findByRole('button', { name: 'أضيفي Ventolin Inhaler 100mcg' })
    await userEvent.keyboard('{Enter}')
    expect(await within(cart()).findByText('Ventolin Inhaler 100mcg')).toBeInTheDocument()
    expect(within(cart()).getByText(/بيضل 2 علبة بعد هالبيعة/)).toBeInTheDocument()
  })

  it('takes cash, gives change, prints the receipt and takes the stock', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const { router } = await openTill()
    await addProduct('ventolin', 'Ventolin Inhaler 100mcg')
    await userEvent.keyboard('{F12}')
    const dialog = await screen.findByRole('dialog', { name: 'الدفع' })
    const received = within(dialog).getByLabelText('المبلغ المستلم من الزبون')
    await userEvent.clear(received)
    await userEvent.type(received, '50')
    expect(within(dialog).getByText('26.00 ₪')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'تأكيد الدفع ↵' }))

    const receipt = await screen.findByRole('dialog', { name: 'الإيصال' })
    expect(within(receipt).getByText('INV-000246')).toBeInTheDocument()
    expect(within(receipt).getByText('Ventolin Inhaler 100mcg')).toBeInTheDocument()
    expect(print).toHaveBeenCalledOnce()
    await userEvent.click(within(receipt).getByRole('button', { name: 'بيع جديد' }))
    expect(within(cart()).getByText(/الفاتورة فاضية/)).toBeInTheDocument()

    await router.navigate('/products/5')
    // The product was read before the sale; the page shows the fresh count once it arrives.
    expect((await screen.findAllByText('2 علبة')).length).toBeGreaterThan(0)
    expect(screen.queryByText('3 علبة')).not.toBeInTheDocument()
  })

  it('sells on credit, and going over the limit needs the manager', async () => {
    vi.spyOn(window, 'print').mockImplementation(() => {})
    await openTill()
    await userEvent.type(screen.getByRole('searchbox', { name: 'الزبون' }), 'أبو أحمد')
    await userEvent.click(await screen.findByRole('button', { name: /أبو أحمد الشوا/ }))
    await addProduct('insulin', 'Insulin NovoRapid FlexPen')
    await userEvent.click(
      within(cart()).getByRole('button', { name: 'زيدي Insulin NovoRapid FlexPen' }),
    )
    await userEvent.click(within(cart()).getByRole('button', { name: 'الدفع F12' }))

    const dialog = await screen.findByRole('dialog', { name: 'الدفع' })
    await userEvent.click(within(dialog).getByRole('radio', { name: 'آجل' }))
    expect(within(dialog).getByText('418.00 ₪')).toBeInTheDocument()
    expect(within(dialog).getByText(/بيتجاوز حد الدين بـ 118.00 ₪/)).toBeInTheDocument()
    const confirm = within(dialog).getByRole('button', { name: 'تأكيد الدفع ↵' })
    expect(confirm).toBeDisabled()
    await userEvent.click(
      within(dialog).getByRole('checkbox', { name: 'موافقة المدير على تجاوز الحد' }),
    )
    await userEvent.click(confirm)
    const receipt = await screen.findByRole('dialog', { name: 'الإيصال' })
    expect(within(receipt).getByText('آجل على أبو أحمد الشوا')).toBeInTheDocument()
  })

  it('will not sell on credit to a customer who pays on the spot', async () => {
    await openTill()
    await userEvent.type(screen.getByRole('searchbox', { name: 'الزبون' }), 'أحمد عودة')
    await userEvent.click(await screen.findByRole('button', { name: /^أحمد عودة/ }))
    await addProduct('ventolin', 'Ventolin Inhaler 100mcg')
    await userEvent.click(within(cart()).getByRole('button', { name: 'الدفع F12' }))
    const dialog = await screen.findByRole('dialog', { name: 'الدفع' })
    await userEvent.click(within(dialog).getByRole('radio', { name: 'آجل' }))
    expect(within(dialog).getByText(/أحمد عودة مش مسموح إله بالآجل/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'تأكيد الدفع ↵' })).toBeDisabled()
  })

  it('adds a new customer from the till, with name and phone only', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await openTill()
    await userEvent.type(screen.getByRole('searchbox', { name: 'الزبون' }), 'رامي')
    await userEvent.click(await screen.findByRole('button', { name: '+ زبون جديد: رامي' }))
    const drawer = screen.getByRole('dialog', { name: 'زبون جديد' })
    expect(within(drawer).getByLabelText('الاسم')).toHaveValue('رامي')
    expect(within(drawer).queryByLabelText('حد الدين')).not.toBeInTheDocument()
    await userEvent.type(within(drawer).getByLabelText('رقم الهاتف'), '0598 222 333')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ الزبون' }))
    expect(await within(cart()).findByText('رامي')).toBeInTheDocument()
    expect(within(cart()).getByText(/عليه 0.00 ₪ · الحد 300.00 ₪/)).toBeInTheDocument()
  })

  it('holds a sale to serve the next customer, then resumes it', async () => {
    await openTill()
    await addProduct('ventolin', 'Ventolin Inhaler 100mcg')
    await userEvent.click(within(cart()).getByRole('button', { name: 'تعليق الفاتورة' }))
    expect(await screen.findByText('انعلقت فاتورة 1')).toBeInTheDocument()
    expect(within(cart()).getByText('فاتورة 4')).toBeInTheDocument()
    expect(within(cart()).getByText(/الفاتورة فاضية/)).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: 'فاتورة 1 · معلقة · 1 أصناف' }))
    expect(await within(cart()).findByText('Ventolin Inhaler 100mcg')).toBeInTheDocument()
    expect(within(cart()).getByText('فاتورة 1')).toBeInTheDocument()
  })

  it("keeps a cashier's discount within their limit", async () => {
    localStorage.setItem('mockRole', 'cashier')
    await openTill()
    await addProduct('augm', 'Augmentin 625mg 14 Tablets')
    await userEvent.keyboard('{F8}')
    const dialog = await screen.findByRole('dialog', { name: 'خصم على الفاتورة' })
    expect(within(dialog).getByText('حدك 5% من الفاتورة')).toBeInTheDocument()
    await userEvent.type(within(dialog).getByLabelText('قيمة الخصم'), '5')
    expect(within(dialog).getByText('الخصم أكبر من حدك. بدها موافقة المدير.')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'تطبيق الخصم' })).toBeDisabled()
    await userEvent.clear(within(dialog).getByLabelText('قيمة الخصم'))
    await userEvent.type(within(dialog).getByLabelText('قيمة الخصم'), '1')
    await userEvent.click(within(dialog).getByRole('button', { name: 'تطبيق الخصم' }))
    expect(within(cart()).getByText('38.00 ₪')).toBeInTheDocument()
  })
})
