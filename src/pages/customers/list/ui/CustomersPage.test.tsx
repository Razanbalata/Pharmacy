import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '@test/render'

async function rows() {
  const table = await screen.findByRole('table', { name: 'الزبائن والديون' })
  await within(table).findAllByRole('link')
  return within(table).getAllByRole('row').slice(1)
}

async function row(name: string) {
  const link = await within(await screen.findByRole('table')).findByRole('link', { name })
  return within(link.closest('tr')!)
}

describe('CustomersPage', () => {
  it('shows the debts, who owes longest first, and how late they are', async () => {
    await renderApp('/customers')
    expect(await screen.findByText('1,245.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('2 · 530.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('309.00 ₪')).toBeInTheDocument()

    const list = await rows()
    expect(list).toHaveLength(10)
    expect(within(list[0]!).getByRole('link', { name: 'أبو يوسف البطش' })).toBeInTheDocument()
    expect(within(list[0]!).getByText('متأخر 46 يوم')).toBeInTheDocument()

    const nadia = await row('نادية الحلو')
    expect(nadia.getByText('320.00 ₪')).toBeInTheDocument()
    expect(nadia.getByText('تجاوز الحد 300.00')).toBeInTheDocument()
    expect(nadia.getByRole('link', { name: 'تذكير واتساب: نادية الحلو' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/970597552310?text='),
    )

    const ahmad = await row('أحمد عودة')
    expect(ahmad.getByText('بدون آجل')).toBeInTheDocument()
    expect(ahmad.queryByRole('button', { name: /تسديد/ })).not.toBeInTheDocument()
  })

  it('filters by late and over the limit, and finds by phone', async () => {
    await renderApp('/customers')
    await rows()
    await userEvent.click(screen.getByRole('radio', { name: 'متأخرين · 2' }))
    await within(screen.getByRole('table')).findByText('نادية الحلو')
    expect(await rows()).toHaveLength(2)

    await userEvent.click(screen.getByRole('radio', { name: 'تجاوزوا الحد · 1' }))
    await within(screen.getByRole('table')).findByText('نادية الحلو')
    expect(await rows()).toHaveLength(1)

    await userEvent.click(screen.getByRole('radio', { name: 'الكل · 10' }))
    await userEvent.type(screen.getByRole('searchbox'), '0595')
    await within(screen.getByRole('table')).findByText('سامي حمدان')
    expect(await rows()).toHaveLength(1)
  })

  it('takes a payment, prints a receipt, and the debt goes down', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    await renderApp('/customers')
    await (await row('أبو أحمد الشوا')).getByRole('button', { name: 'تسديد: أبو أحمد الشوا' })
    await userEvent.click(screen.getByRole('button', { name: 'تسديد: أبو أحمد الشوا' }))

    const drawer = screen.getByRole('dialog', { name: 'تسديد دين' })
    const amount = within(drawer).getByLabelText('المبلغ المستلم')
    expect(amount).toHaveValue('180')
    await userEvent.clear(amount)
    await userEvent.type(amount, '250')
    await userEvent.click(within(drawer).getByRole('button', { name: 'تأكيد التسديد' }))
    expect(within(drawer).getByText('المبلغ أكبر من الدين')).toBeInTheDocument()

    await userEvent.click(within(drawer).getByRole('button', { name: '100.00' }))
    expect(within(drawer).getByText('80.00 ₪')).toBeInTheDocument()
    await userEvent.click(within(drawer).getByRole('button', { name: 'تأكيد التسديد' }))

    const receipt = await screen.findByRole('region', { name: 'سند قبض' })
    expect(within(receipt).getByText('R-0058')).toBeInTheDocument()
    expect(within(receipt).getByText('100.00 ₪')).toBeInTheDocument()
    expect(within(receipt).getByText('80.00 ₪')).toBeInTheDocument()
    await vi.waitFor(() => expect(print).toHaveBeenCalled())
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/970599123456'),
      '_blank',
      'noopener',
    )

    const dialog = screen.getByRole('dialog', { name: 'سند قبض' })
    await userEvent.click(within(dialog).getAllByRole('button', { name: 'إغلاق' }).at(-1)!)
    expect(await screen.findByText('1,145.00 ₪')).toBeInTheDocument()
    expect((await row('أبو أحمد الشوا')).getByText('80.00 ₪')).toBeInTheDocument()
  })

  it('adds a customer with an old notebook debt, refusing a phone already used', async () => {
    await renderApp('/customers')
    await userEvent.click(await screen.findByRole('button', { name: '+ زبون' }))
    const drawer = screen.getByRole('dialog', { name: 'زبون جديد' })
    await userEvent.type(within(drawer).getByLabelText('الاسم'), 'رنا الخطيب')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ الزبون' }))
    expect(await within(drawer).findByText('البيع الآجل بده رقم هاتف.')).toBeInTheDocument()

    await userEvent.type(within(drawer).getByLabelText('رقم الهاتف'), '0599 123 456')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ الزبون' }))
    expect(await within(drawer).findByText('هالرقم مسجل لزبون تاني.')).toBeInTheDocument()

    await userEvent.clear(within(drawer).getByLabelText('رقم الهاتف'))
    await userEvent.type(within(drawer).getByLabelText('رقم الهاتف'), '0599 777 888')
    await userEvent.type(within(drawer).getByLabelText(/دين قديم من الدفتر/), '75')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ الزبون' }))

    expect(await screen.findByText('انحفظ رنا الخطيب')).toBeInTheDocument()
    expect((await row('رنا الخطيب')).getByText('75.00 ₪')).toBeInTheDocument()
    expect(await screen.findByText('1,320.00 ₪')).toBeInTheDocument()
  })
})
