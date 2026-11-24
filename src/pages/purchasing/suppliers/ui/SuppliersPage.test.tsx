import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function row(name: string) {
  const link = await within(await screen.findByRole('table')).findByRole('link', { name })
  return within(link.closest('tr')!)
}

describe('SuppliersPage', () => {
  it('lists suppliers with what is owed to each, and the totals', async () => {
    await renderApp('/suppliers')
    expect(await screen.findByText('1,630.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('مجموع المستحق للموردين')).toBeInTheDocument()
    const shifa = await row('شركة الشفاء للأدوية')
    expect(shifa.getByText('420.00 ₪')).toBeInTheDocument()
    expect(shifa.getByRole('link', { name: 'واتساب شركة الشفاء للأدوية' })).toHaveAttribute(
      'href',
      'https://wa.me/970599111222',
    )
    expect(shifa.getByRole('link', { name: 'طلب جديد: شركة الشفاء للأدوية' })).toHaveAttribute(
      'href',
      '/purchases/new?supplier=2',
    )
    const quds = await row('شركة القدس للأدوية')
    expect(quds.getByText('ما في مستحق')).toBeInTheDocument()
    expect(quds.queryByRole('button', { name: /تسجيل دفعة/ })).not.toBeInTheDocument()
  })

  it('adds a supplier, refusing a repeated name or a wrong number', async () => {
    await renderApp('/suppliers')
    await userEvent.click(await screen.findByRole('button', { name: '+ مورد' }))
    const drawer = screen.getByRole('dialog', { name: 'مورد جديد' })
    await userEvent.type(within(drawer).getByLabelText('اسم المورد'), 'مستودع النور')
    await userEvent.type(within(drawer).getByLabelText(/الجوال أو الهاتف/), '123')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ' }))
    expect(await within(drawer).findByText(/رقم غير صحيح/)).toBeInTheDocument()

    await userEvent.clear(within(drawer).getByLabelText(/الجوال أو الهاتف/))
    await userEvent.type(within(drawer).getByLabelText(/الجوال أو الهاتف/), '082861234')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ' }))
    expect(await within(drawer).findByText('في مورد بنفس الاسم')).toBeInTheDocument()

    await userEvent.clear(within(drawer).getByLabelText('اسم المورد'))
    await userEvent.type(within(drawer).getByLabelText('اسم المورد'), 'مستودع الأمل')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ' }))
    expect(await screen.findByText('انحفظ مستودع الأمل')).toBeInTheDocument()
    expect((await row('مستودع الأمل')).getByText('ما في مستحق')).toBeInTheDocument()
  })

  it('records a payment and lowers what is owed', async () => {
    await renderApp('/suppliers')
    await userEvent.click(
      (await row('شركة الشفاء للأدوية')).getByRole('button', {
        name: 'تسجيل دفعة: شركة الشفاء للأدوية',
      }),
    )
    const drawer = screen.getByRole('dialog', { name: 'تسجيل دفعة' })
    expect(within(drawer).getByText('شركة الشفاء للأدوية · المستحق 420.00 ₪')).toBeInTheDocument()
    const amount = within(drawer).getByLabelText('المبلغ')
    expect(amount).toHaveValue('420')
    await userEvent.clear(amount)
    await userEvent.type(amount, '500')
    await userEvent.click(within(drawer).getByRole('button', { name: 'سجّلي الدفعة' }))
    expect(within(drawer).getByText('المبلغ أكبر من المستحق')).toBeInTheDocument()

    await userEvent.clear(amount)
    await userEvent.type(amount, '200')
    expect(within(drawer).getByText('220.00 ₪')).toBeInTheDocument()
    await userEvent.click(within(drawer).getByRole('button', { name: 'سجّلي الدفعة' }))
    expect(await screen.findByText('انسجلت دفعة 200.00 ₪ · سند RV-0035')).toBeInTheDocument()
    expect((await row('شركة الشفاء للأدوية')).getByText('220.00 ₪')).toBeInTheDocument()
  })
})
