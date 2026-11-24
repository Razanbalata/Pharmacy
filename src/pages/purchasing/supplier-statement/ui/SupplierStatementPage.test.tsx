import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

function balances() {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((tr) => within(tr).getAllByRole('cell').at(-1)?.textContent)
}

describe('SupplierStatementPage', () => {
  it('shows the account for the month with a running balance', async () => {
    await renderApp('/suppliers/2')
    expect(await screen.findByRole('heading', { name: 'شركة الشفاء للأدوية' })).toBeVisible()
    expect(screen.getByText('خالد · مبيعات · 0599 111 222 · غزة، الرمال')).toBeInTheDocument()
    expect(balances()).toEqual(['0.00', '700.00', '0.00', '920.00', '420.00'])
    expect(screen.getByRole('link', { name: 'فاتورة شراء PO-0012' })).toHaveAttribute(
      'href',
      '/purchases/12',
    )
    expect(screen.getByText('1,620.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('1,200.00 ₪')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PO-0015' })).toHaveAttribute('href', '/purchases/15')
  })

  it('carries what was owed before the period into its first line', async () => {
    await renderApp('/suppliers/1')
    await screen.findByRole('heading', { name: 'المستودع الطبي الحديث' })
    expect(balances()).toEqual(['650.00'])
    expect(screen.getByText('ما في حركات بهالفترة.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'هالسنة' }))
    expect(await screen.findByText('فاتورة شراء PO-0007')).toBeInTheDocument()
    expect(balances()).toEqual(['0.00', '650.00'])
  })

  it('pays off an invoice and clears what is owed', async () => {
    await renderApp('/suppliers/2')
    await userEvent.click(await screen.findByRole('button', { name: 'تسجيل دفعة' }))
    const drawer = screen.getByRole('dialog', { name: 'تسجيل دفعة' })
    await userEvent.selectOptions(
      within(drawer).getByLabelText(/على أي فاتورة/),
      'PO-0012 · باقي 420.00',
    )
    await userEvent.click(within(drawer).getByRole('radio', { name: 'تحويل بنكي' }))
    expect(within(drawer).queryByText('من درج الوردية الحالية')).not.toBeInTheDocument()
    await userEvent.click(within(drawer).getByRole('button', { name: 'سجّلي الدفعة' }))

    expect(await screen.findByText(/انسجلت دفعة 420.00 ₪/)).toBeInTheDocument()
    expect(await screen.findByText('0.00 ₪')).toBeInTheDocument()
    expect(balances().at(-1)).toBe('0.00')
    expect(screen.queryByRole('button', { name: 'تسجيل دفعة' })).not.toBeInTheDocument()
  })
})
