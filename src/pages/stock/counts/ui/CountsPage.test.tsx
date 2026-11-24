import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function openCount() {
  await renderApp('/stock/counts')
  return screen.findByRole('heading', { name: 'جرد مضادات حيوية' })
}

describe('CountsPage', () => {
  it('shows the open count with what was counted, the differences and their value', async () => {
    await openCount()
    expect(screen.getByText('5 / 6')).toBeInTheDocument()
    expect(screen.getByText('− 75.00 ₪')).toBeInTheDocument()
    expect(screen.getByLabelText('العدد الفعلي: Augmentin 625mg 14 Tablets A-2291')).toHaveValue(
      '29',
    )
    expect(
      screen.getByLabelText('سبب الفرق: Augmentin 625mg 14 Tablets A-2291'),
    ).toHaveDisplayValue('نقص غير معروف')
    await userEvent.click(screen.getByRole('button', { name: 'ما انعدّ · 1' }))
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(1)
    expect(within(rows[0]!).getByText('Augmentin 457mg/5ml Syrup')).toBeInTheDocument()
    expect(screen.getByText(/ضل 1 أسطر ما انعدّت/)).toBeInTheDocument()
  })

  it('needs a reason for every difference, then adjusts stock when approved', async () => {
    await openCount()
    await userEvent.click(screen.getByRole('button', { name: 'اعتماد الفروقات' }))
    expect(screen.getByRole('alert')).toHaveTextContent('كل فرق لازمله سبب قبل الاعتماد.')

    await userEvent.selectOptions(
      screen.getByLabelText(/سبب الفرق: Augmentin 1g 14 Tablets/),
      'تالف ما انسجل',
    )
    await userEvent.click(screen.getByRole('button', { name: 'اعتماد الفروقات' }))
    const dialog = screen.getByRole('dialog', { name: 'اعتماد 4 فروقات؟' })
    expect(within(dialog).getByText(/−75.00 ₪/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'اعتماد الفروقات' }))

    expect(await screen.findByText('اعتمدتِ الجرد، وتعدلت 4 كميات')).toBeInTheDocument()
    expect(await screen.findByText('ما في جرد مفتوح.')).toBeInTheDocument()
    expect(screen.getAllByText('معتمد')).toHaveLength(2)
  })

  it('records an adjustment movement for each approved difference', async () => {
    const { router } = await renderApp('/stock/counts')
    await screen.findByRole('heading', { name: 'جرد مضادات حيوية' })
    await userEvent.selectOptions(
      screen.getByLabelText(/سبب الفرق: Augmentin 1g 14 Tablets/),
      'غير ذلك',
    )
    await userEvent.click(screen.getByRole('button', { name: 'اعتماد الفروقات' }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'اعتماد الفروقات' }),
    )
    await screen.findByText('ما في جرد مفتوح.')

    await router.navigate('/stock/movements')
    await userEvent.click(await screen.findByRole('button', { name: 'تسوية جرد' }))
    const table = screen.getByRole('table', { name: 'سجل الحركات' })
    await within(table).findByText('Augmentin 1g 14 Tablets')
    // Four new adjustments, and the one from the count on 15/11.
    expect(within(table).getAllByRole('row').slice(1)).toHaveLength(5)
  })

  it('starts a new count for one category', async () => {
    await openCount()
    await userEvent.selectOptions(
      screen.getByLabelText(/سبب الفرق: Augmentin 1g 14 Tablets/),
      'غير ذلك',
    )
    await userEvent.click(screen.getByRole('button', { name: 'اعتماد الفروقات' }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'اعتماد الفروقات' }),
    )
    await screen.findByText('ما في جرد مفتوح.')

    await screen.findByRole('option', { name: 'مسكنات' })
    await userEvent.selectOptions(screen.getByLabelText('شو بدك تجردي؟'), 'مسكنات')
    await userEvent.click(screen.getByRole('button', { name: 'ابدئي الجرد' }))
    expect(await screen.findByRole('heading', { name: 'جرد مسكنات' })).toBeInTheDocument()
    expect(screen.getByText('0 / 3')).toBeInTheDocument()
  })
})
