import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function rows() {
  const table = await screen.findByRole('table', { name: 'سجل الورديات' })
  await within(table).findAllByRole('cell')
  return within(table).getAllByRole('row').slice(1)
}

describe('ShiftsPage', () => {
  it("lists the week's shifts with what each should have held and the difference", async () => {
    await renderApp('/finance/shifts')
    expect(await screen.findByText('الوردية 14 · محمد')).toBeInTheDocument()
    expect(screen.getByText('− 14.00 ₪')).toBeInTheDocument()

    const list = await rows()
    expect(list).toHaveLength(7)
    expect(within(list[0]!).getByRole('link', { name: 'افتحي ملخص الوردية 14' })).toHaveAttribute(
      'href',
      '/sales/shift',
    )
    expect(within(list[0]!).getByText('مفتوحة', { selector: 'span.rounded-pill' })).toBeVisible()
    const eleven = list[3]!
    expect(within(eleven).getByText('840.00')).toBeInTheDocument()
    expect(within(eleven).getByText('834.00')).toBeInTheDocument()
    expect(within(eleven).getByText('− 6.00')).toBeInTheDocument()
    expect(within(eleven).getByText('غلطة بالباقي')).toBeInTheDocument()
  })

  it('narrows to shifts with a difference, to one cashier, or to today', async () => {
    await renderApp('/finance/shifts')
    await rows()
    await userEvent.click(screen.getByRole('checkbox', { name: 'فيها فرق بس' }))
    await within(screen.getByRole('table')).findByText('زبون ما استنى الباقي')
    expect(await rows()).toHaveLength(3)

    await userEvent.click(screen.getByRole('checkbox', { name: 'فيها فرق بس' }))
    await userEvent.selectOptions(await screen.findByLabelText('الموظف'), 'سارة يوسف')
    expect(await screen.findByText('ورديات بالفترة')).toBeInTheDocument()
    await screen.findByText((_, element) => element?.textContent === '2' && element.tagName === 'P')
    expect(await rows()).toHaveLength(2)

    await userEvent.selectOptions(screen.getByLabelText('الموظف'), '')
    await userEvent.click(screen.getByRole('radio', { name: 'اليوم' }))
    await screen.findByText((_, element) => element?.textContent === '1' && element.tagName === 'P')
    expect(await rows()).toHaveLength(1)
  })

  it('is for the manager only', async () => {
    localStorage.setItem('mockRole', 'pharmacist')
    await renderApp('/finance/shifts')
    expect(await screen.findByText('هالصفحة مش ضمن صلاحياتك')).toBeInTheDocument()
  })
})
