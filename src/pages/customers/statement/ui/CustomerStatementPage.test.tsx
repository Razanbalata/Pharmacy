import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '@test/render'

function statement() {
  return screen.getByRole('table', { name: 'أبو أحمد الشوا' })
}

describe('CustomerStatementPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lists the account with a running balance, and what the customer buys', async () => {
    await renderApp('/customers/1')
    expect(await screen.findByRole('heading', { name: 'أبو أحمد الشوا' })).toBeInTheDocument()
    expect(screen.getByText(/زبون من 03\/2026 · مسموح إله بالآجل/)).toBeInTheDocument()
    expect(screen.getByText('389.00 ₪')).toBeInTheDocument()

    const rows = within(statement()).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(6)
    expect(within(rows[0]!).getByText('رصيد أول الفترة')).toBeInTheDocument()
    expect(within(rows[2]!).getByText('تسديد نقدي')).toBeInTheDocument()
    expect(within(rows[2]!).getByText('سند قبض R-0041 · سارة')).toBeInTheDocument()
    expect(within(rows[4]!).getByText('61.00')).toBeInTheDocument()
    expect(within(rows[5]!).getByRole('link', { name: 'فاتورة آجلة INV-000243' })).toHaveAttribute(
      'href',
      '/sales/invoices/243',
    )
    expect(within(rows[5]!).getByText('180.00')).toBeInTheDocument()

    const recent = screen.getByRole('region', { name: 'أدوية اشتراها مؤخراً' })
    expect(within(recent).getByText('Insulin NovoRapid FlexPen')).toBeInTheDocument()
    expect(screen.getByText('بيسدد أول كل شهر. ابنه أحمد بيستلم عنه أحياناً.')).toBeInTheDocument()
  })

  it('carries older debt into the opening balance of the period', async () => {
    await renderApp('/customers/5')
    const table = await screen.findByRole('table', { name: 'نادية الحلو' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(within(table).getAllByRole('row')[1]!).getByText('200.00')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'آخر 3 أشهر' }))
    await within(table).findByText('فاتورة آجلة INV-000160')
    expect(within(within(table).getAllByRole('row')[1]!).getByText('0.00')).toBeInTheDocument()
  })

  it('records a cash payment that the shift drawer then expects', async () => {
    vi.spyOn(window, 'print').mockImplementation(() => {})
    const { router } = await renderApp('/customers/1')
    await userEvent.click(await screen.findByRole('button', { name: 'تسديد دين' }))
    const drawer = screen.getByRole('dialog', { name: 'تسديد دين' })
    await userEvent.click(within(drawer).getByRole('checkbox', { name: 'اطبع سند قبض' }))
    await userEvent.click(within(drawer).getByRole('checkbox', { name: /ابعتله تأكيد واتساب/ }))
    await userEvent.click(within(drawer).getByRole('button', { name: /كل الدين/ }))
    await userEvent.click(within(drawer).getByRole('button', { name: 'تأكيد التسديد' }))

    expect(await screen.findByText('انسجل تسديد 180.00 ₪ · سند R-0058')).toBeInTheDocument()
    const last = within(statement()).getAllByRole('row').at(-1)!
    expect(within(last).getByText('سند قبض R-0058 · رزان')).toBeInTheDocument()
    expect(within(last).getByText('0.00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'تسديد دين' })).not.toBeInTheDocument()

    await router.navigate('/sales/shift')
    expect(await screen.findByText('تسديد ديون نقدي')).toBeInTheDocument()
    expect(screen.getByText('676.00 ₪')).toBeInTheDocument()
  })

  it('lets the manager change the limit, but not the cashier', async () => {
    await renderApp('/customers/1')
    await userEvent.click(await screen.findByRole('button', { name: 'تعديل' }))
    const drawer = screen.getByRole('dialog', { name: 'تعديل أبو أحمد الشوا' })
    const limit = within(drawer).getByLabelText('حد الدين')
    await userEvent.clear(limit)
    await userEvent.type(limit, '500')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ الزبون' }))
    expect(await screen.findByText('500.00 ₪')).toBeInTheDocument()
  })

  it('shows the cashier the account without the edit button', async () => {
    localStorage.setItem('mockRole', 'cashier')
    await renderApp('/customers/1')
    await screen.findByRole('heading', { name: 'أبو أحمد الشوا' })
    expect(screen.queryByRole('button', { name: 'تعديل' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'تسديد دين' })).toBeInTheDocument()
  })
})
