import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function rows() {
  const table = await screen.findByRole('table', { name: 'المصاريف' })
  await within(table).findAllByRole('cell')
  return within(table).getAllByRole('row').slice(1)
}

describe('ExpensesPage', () => {
  it("shows the month's expenses by type, against the month before", async () => {
    await renderApp('/finance/expenses')
    expect(await screen.findByText('3,450.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('الشهر اللي قبله 3,120.00 ₪')).toBeInTheDocument()
    const types = within(screen.getByRole('list', { name: 'حسب النوع' })).getAllByRole('listitem')
    expect(types).toHaveLength(7)
    expect(within(types[0]!).getByText('الإيجار')).toBeInTheDocument()
    expect(within(types[2]!).getByText('500.00')).toBeInTheDocument()
    expect(screen.getByText(/الرواتب بتنسجل آخر الشهر/)).toBeInTheDocument()

    const list = await rows()
    expect(list).toHaveLength(8)
    expect(within(list[0]!).getByText('درج الوردية 12')).toBeInTheDocument()
    expect(within(list[0]!).getByText('جالون ديزل')).toBeInTheDocument()
    expect(within(list[7]!).getByText('شهري')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'الشهر الماضي' }))
    expect(await screen.findByText('3,120.00 ₪')).toBeInTheDocument()
    expect(await rows()).toHaveLength(7)
  })

  it('takes fuel money from the drawer, and the shift then expects less cash', async () => {
    const { router } = await renderApp('/finance/expenses')
    const form = await screen.findByRole('form', { name: 'مصروف جديد' })
    await within(form).findByRole('option', { name: 'درج الوردية 14' })
    await userEvent.click(within(form).getByRole('button', { name: '+ إضافة' }))
    expect(within(form).getByText('اكتبي مبلغ أكبر من صفر')).toBeInTheDocument()

    await userEvent.type(within(form).getByLabelText('المبلغ'), '120')
    await userEvent.type(within(form).getByLabelText(/ملاحظة/), 'نص جالون')
    await userEvent.click(within(form).getByRole('button', { name: '+ إضافة' }))
    expect(await screen.findByText('انضاف مصروف وقود المولد بـ 120.00 ₪')).toBeInTheDocument()
    expect(await screen.findByText('3,570.00 ₪')).toBeInTheDocument()
    expect(within((await rows())[0]!).getByText('درج الوردية 14')).toBeInTheDocument()

    await router.navigate('/sales/shift')
    expect(await screen.findByText('مصاريف من الدرج')).toBeInTheDocument()
    expect(screen.getByText('376.00 ₪')).toBeInTheDocument()
  })

  it('needs a note for "other", and records rent paid outside the drawer', async () => {
    await renderApp('/finance/expenses')
    const form = await screen.findByRole('form', { name: 'مصروف جديد' })
    await userEvent.selectOptions(within(form).getByLabelText('النوع'), 'غير ذلك')
    await userEvent.type(within(form).getByLabelText('المبلغ'), '40')
    await userEvent.click(within(form).getByRole('button', { name: '+ إضافة' }))
    expect(within(form).getByText('اكتبي شو المصروف')).toBeInTheDocument()

    await userEvent.selectOptions(within(form).getByLabelText('النوع'), 'رواتب')
    await userEvent.clear(within(form).getByLabelText('المبلغ'))
    await userEvent.type(within(form).getByLabelText('المبلغ'), '1800')
    await userEvent.selectOptions(within(form).getByLabelText('من وين؟'), 'خارج الدرج')
    await userEvent.click(within(form).getByRole('checkbox', { name: 'بيتكرر كل شهر' }))
    await userEvent.click(within(form).getByRole('button', { name: '+ إضافة' }))
    expect(await screen.findByText('5,250.00 ₪')).toBeInTheDocument()
    expect(screen.queryByText(/الرواتب بتنسجل آخر الشهر/)).not.toBeInTheDocument()
  })
})
