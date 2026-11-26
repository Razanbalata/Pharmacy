import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function row(name: string) {
  const table = await screen.findByRole('table', { name: 'المدفوعات' })
  return within((await within(table).findByRole('link', { name })).closest('tr')!)
}

describe('PlatformBillingPage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'platform'))

  it('shows the plans without prices yet, and saves a price', async () => {
    await renderApp('/platform/billing')
    expect(await screen.findByText(/الأسعار لسا ما تحددت/)).toBeInTheDocument()
    const price = screen.getByLabelText('أساسية: السعر بالشيكل / شهر')
    await userEvent.click(within(price.closest('form')!).getByRole('button', { name: 'حفظ السعر' }))
    expect(within(price.closest('form')!).getByText('اكتبي سعر أكبر من صفر')).toBeInTheDocument()
    await userEvent.type(price, '60')
    await userEvent.click(within(price.closest('form')!).getByRole('button', { name: 'حفظ السعر' }))
    expect(await screen.findByText('انحفظ سعر أساسية')).toBeInTheDocument()
  })

  it('confirms a payment, and the pharmacy is on the paid plan', async () => {
    const { router } = await renderApp('/platform/billing')
    expect(await screen.findByText('2 بانتظار التأكيد')).toBeInTheDocument()
    const nour = await row('صيدلية النور')
    expect(nour.getByRole('link', { name: 'إيصال صيدلية النور' })).toHaveAttribute(
      'href',
      expect.stringContaining('data:image/svg+xml'),
    )
    await userEvent.click(nour.getByRole('button', { name: 'تأكيد وتفعيل: صيدلية النور' }))
    expect(await screen.findByText('انأكدت دفعة صيدلية النور وتفعل الاشتراك')).toBeInTheDocument()
    expect(await screen.findByText('1 بانتظار التأكيد')).toBeInTheDocument()
    expect((await row('صيدلية النور')).getByText('مؤكد')).toBeInTheDocument()

    await router.navigate('/platform/pharmacies/2')
    // Two months paid before, and this one.
    expect(await screen.findAllByText(/انأكدت دفعة احترافية، والاشتراك لحد/)).toHaveLength(3)
  })

  it('rejects a payment only with a reason', async () => {
    await renderApp('/platform/billing')
    await userEvent.click(
      (await row('صيدلية الحياة')).getByRole('button', { name: 'رفض: صيدلية الحياة' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'رفض دفعة صيدلية الحياة' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'رفض' }))
    expect(within(dialog).getByText('اكتبي السبب')).toBeInTheDocument()
    await userEvent.type(within(dialog).getByLabelText(/سبب الرفض/), 'المبلغ ناقص')
    await userEvent.click(within(dialog).getByRole('button', { name: 'رفض' }))
    expect(await screen.findByText('انرفضت دفعة صيدلية الحياة')).toBeInTheDocument()
    expect(await (await row('صيدلية الحياة')).findByText('المبلغ ناقص')).toBeInTheDocument()
  })
})
